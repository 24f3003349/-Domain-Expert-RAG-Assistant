"""Fast CPU cross-encoder reranking service using FlashRank (ONNX runtime)."""

from typing import List, Optional
from llama_index.core.schema import NodeWithScore, TextNode

try:
    from flashrank import Ranker, RerankRequest
    FLASHRANK_AVAILABLE = True
except ImportError:
    FLASHRANK_AVAILABLE = False


class FlashRankReranker:
    """Lightweight, low-latency CPU cross-encoder reranker."""

    def __init__(self, model_name: str = "ms-marco-TinyBERT-L-2-v2"):
        self.model_name = model_name
        self._ranker: Optional[Ranker] = None
        if FLASHRANK_AVAILABLE:
            try:
                # 4MB model running on pure ONNX runtime; sub-15ms CPU latency
                self._ranker = Ranker(model_name=model_name, cache_dir="/tmp/flashrank")
            except Exception as e:
                print(f"Warning: Failed to initialize FlashRank with {model_name}: {e}")
                self._ranker = None

    def rerank(
        self,
        query: str,
        nodes: List[NodeWithScore],
        top_n: int = 4,
        score_threshold: float = 0.05,
    ) -> List[NodeWithScore]:
        """Rerank retrieved candidate nodes using cross-attention relevance scoring."""
        if not nodes:
            return []

        if not self._ranker:
            # Fallback to initial ordering if reranker is unavailable
            return nodes[:top_n]

        try:
            node_map = {item.node.id_: item.node for item in nodes}
            passages = [
                {
                    "id": item.node.id_,
                    "text": item.node.get_text(),
                    "meta": item.node.metadata,
                }
                for item in nodes
            ]

            rerank_request = RerankRequest(query=query, passages=passages)
            results = self._ranker.rerank(rerank_request)

            reranked_nodes: List[NodeWithScore] = []
            # Keep top_n sorted by cross-encoder relevance; threshold filtering starves context when 1 chunk > threshold
            for res in results[:top_n]:
                node_id = res.get("id")
                score = float(res.get("score", 0.0))
                if node_id in node_map and score >= score_threshold:
                    reranked_nodes.append(NodeWithScore(node=node_map[node_id], score=score))

            if len(reranked_nodes) < min(top_n, len(results)):
                seen_ids = {n.node.id_ for n in reranked_nodes}
                for res in results:
                    node_id = res.get("id")
                    if node_id in node_map and node_id not in seen_ids:
                        reranked_nodes.append(
                            NodeWithScore(node=node_map[node_id], score=float(res.get("score", 0.0)))
                        )
                        seen_ids.add(node_id)
                    if len(reranked_nodes) >= top_n:
                        break

            return reranked_nodes[:top_n] if reranked_nodes else nodes[:top_n]

        except Exception as e:
            print(f"Warning: FlashRank reranking failed: {e}. Falling back to initial ordering.")
            return nodes[:top_n]
