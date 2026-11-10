"""Hybrid search service combining dense vector search and sparse BM25 retrieval via Reciprocal Rank Fusion."""

import re
import time
from typing import List, Dict, Any, Optional, Tuple

from llama_index.core.schema import NodeWithScore, TextNode
from rank_bm25 import BM25Okapi


def tokenize_text(text: str) -> List[str]:
    """Lightweight regex-based word tokenizer for BM25."""
    if not text:
        return []
    # Lowercase and split on non-alphanumeric characters
    tokens = re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())
    return tokens


class BM25IndexManager:
    """Manages in-memory BM25 indices per tenant (user_id) built from ChromaDB storage."""

    def __init__(self, chroma_collection):
        self.collection = chroma_collection
        # Cache structure: user_id -> {"bm25": BM25Okapi, "nodes": List[TextNode], "timestamp": float}
        self._user_cache: Dict[str, Dict[str, Any]] = {}

    def invalidate(self, user_id: Optional[str] = None) -> None:
        """Invalidate BM25 cache for a specific user or globally."""
        if user_id:
            self._user_cache.pop(str(user_id), None)
        else:
            self._user_cache.clear()

    def _get_or_build_index(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetch user documents from ChromaDB and construct BM25 index."""
        user_key = str(user_id)
        if user_key in self._user_cache:
            return self._user_cache[user_key]

        try:
            # Query all chunks for this user from Chroma
            results = self.collection.get(
                where={"user_id": user_key},
                include=["documents", "metadatas"],
            )

            if not results or not results.get("documents"):
                return None

            raw_docs = results["documents"]
            raw_ids = results["ids"]
            raw_metas = results.get("metadatas") or [{}] * len(raw_docs)

            tokenized_corpus = []
            nodes = []

            for doc_id, doc_text, meta in zip(raw_ids, raw_docs, raw_metas):
                if not doc_text or not doc_text.strip():
                    continue
                tokens = tokenize_text(doc_text)
                if not tokens:
                    continue
                tokenized_corpus.append(tokens)
                nodes.append(TextNode(id_=doc_id, text=doc_text, metadata=meta or {}))

            if not tokenized_corpus:
                return None

            bm25 = BM25Okapi(tokenized_corpus)
            cache_entry = {
                "bm25": bm25,
                "nodes": nodes,
                "timestamp": time.time(),
            }
            self._user_cache[user_key] = cache_entry
            return cache_entry

        except Exception as e:
            print(f"Warning: Failed to build BM25 index for user {user_id}: {e}")
            return None

    def search(self, query: str, user_id: str, top_k: int = 8) -> List[NodeWithScore]:
        """Perform sparse BM25 retrieval for query over user's documents."""
        query_tokens = tokenize_text(query)
        if not query_tokens:
            return []

        index_entry = self._get_or_build_index(user_id)
        if not index_entry:
            return []

        bm25: BM25Okapi = index_entry["bm25"]
        nodes: List[TextNode] = index_entry["nodes"]

        # Calculate scores
        scores = bm25.get_scores(query_tokens)
        if len(scores) == 0:
            return []

        # Find top k indices with score > 0
        indexed_scores = [(idx, score) for idx, score in enumerate(scores) if score > 0.0]
        if not indexed_scores:
            return []

        # Sort descending by score
        indexed_scores.sort(key=lambda x: x[1], reverse=True)
        top_entries = indexed_scores[:top_k]

        max_score = top_entries[0][1] if top_entries else 1.0
        results = []
        for idx, score in top_entries:
            norm_score = float(score / max_score) if max_score > 0 else 0.0
            results.append(NodeWithScore(node=nodes[idx], score=norm_score))

        return results


def reciprocal_rank_fusion(
    dense_nodes: List[NodeWithScore],
    sparse_nodes: List[NodeWithScore],
    k: int = 60,
    dense_weight: float = 0.6,
    sparse_weight: float = 0.4,
    top_n: int = 10,
) -> List[NodeWithScore]:
    """
    Combine dense and sparse candidate lists using Reciprocal Rank Fusion (RRF).
    RRF(d) = (w_dense / (k + rank_dense)) + (w_sparse / (k + rank_sparse))
    """
    node_map: Dict[str, TextNode] = {}
    rrf_scores: Dict[str, float] = {}

    # Process Dense ranks
    for rank, item in enumerate(dense_nodes, start=1):
        node_id = item.node.id_
        node_map[node_id] = item.node
        rrf_scores[node_id] = rrf_scores.get(node_id, 0.0) + (dense_weight / (k + rank))

    # Process Sparse ranks
    for rank, item in enumerate(sparse_nodes, start=1):
        node_id = item.node.id_
        if node_id not in node_map:
            node_map[node_id] = item.node
        rrf_scores[node_id] = rrf_scores.get(node_id, 0.0) + (sparse_weight / (k + rank))

    if not rrf_scores:
        return []

    # Sort descending by RRF score
    sorted_items = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

    fused_results = []
    for node_id, score in sorted_items[:top_n]:
        fused_results.append(NodeWithScore(node=node_map[node_id], score=float(score)))

    return fused_results
