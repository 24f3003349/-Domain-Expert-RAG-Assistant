"""RAG service for document Q&A using Local Ollama and ChromaDB."""

import os
import json
import unicodedata
import hashlib
import re
from typing import AsyncGenerator, List, Union, Dict, Any, Optional, Tuple

import chromadb
import redis.asyncio as aioredis
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.core.schema import NodeWithScore, TextNode
from llama_index.core.vector_stores.types import MetadataFilters, MetadataFilter, FilterOperator
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from llama_index.vector_stores.chroma import ChromaVectorStore

from app.core.config import get_settings
from app.services.storage_service import StorageService
from app.services.hybrid_search import BM25IndexManager, reciprocal_rank_fusion
from app.services.reranker import FlashRankReranker

settings = get_settings()


class RAGService:
    """Service for Retrieval-Augmented Generation using Local Ollama & ChromaDB."""

    # Strict Context Budget: ~5,500 chars (1,400-1,600 tokens)
    # Bounded prompt prefill cuts local TTFT from 40s to ~3s and guarantees zero context overflow
    MAX_CONTEXT_CHARS = 5500
    MAX_CHUNK_CHARS = 1200

    def __init__(self):
        """Initialize the RAG service."""
        # --- LOCAL LLM (OLLAMA) ---
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        # ponytail: num_gpu=41 + thinking="low" targets 6GB VRAM (needs OLLAMA_FLASH_ATTENTION=1, OLLAMA_KV_CACHE_TYPE=q8_0); bump/env-gate if switching model size
        self.llm = Ollama(
            base_url=ollama_base_url,
            model="granite4.2:8b",
            context_window=4096,
            keep_alive="24h",  # Keep model resident in VRAM (kills 8-15s cold load)
            request_timeout=300.0,
            temperature=0.2,  # Low variance, fast greedy decode
            thinking="low",  # Bounded CoT effort: preserves thinking trace while cutting content TTFT
            additional_kwargs={"num_gpu": 41},  # Bypass auto-fit 1GB margin so all 41 layers stay on GPU
        )
        # --- LOCAL EMBEDDINGS ---
        self.embed_model = OllamaEmbedding(
            base_url=ollama_base_url,
            model_name="nomic-embed-text",
            keep_alive="24h",
            ollama_additional_kwargs={"num_gpu": 0},  # Pin embedder to CPU (~155ms) so it never evicts LLM VRAM
        )

        # --- LOCAL VECTOR STORAGE (CHROMADB) ---
        db_path = os.path.join(os.getcwd(), "chroma_db")
        db = chromadb.PersistentClient(path=db_path)
        chroma_collection = db.get_or_create_collection("aura_intelligence")
        
        self.vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

        # --- HYBRID SEARCH & RERANKER ---
        self.bm25_manager = BM25IndexManager(chroma_collection=chroma_collection)
        self.reranker = FlashRankReranker(model_name="ms-marco-TinyBERT-L-2-v2")

        # Initialize storage service (MinIO)
        self.storage_service = StorageService()

        # Initialize storage context
        self.storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

        # Initialize Redis Cache client for zero-latency instant replays
        try:
            self.redis = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        except Exception as e:
            print(f"Warning: Redis cache initialization failed: {e}")
            self.redis = None

        try:
            # Create/Load index
            self.index = VectorStoreIndex.from_vector_store(
                self.vector_store,
                embed_model=self.embed_model,
            )
        except Exception as e:
            print(f"CRITICAL: Failed to load vector index: {str(e)}")
            self.index = None

    @staticmethod
    def _deduplicate_sentences(chunk_text: str, seen_sentences: set) -> str:
        """Strip redundant sentences that appeared in previously processed overlapping chunks."""
        sentences = re.split(r'(?<=[.!?])\s+', chunk_text)
        kept = []
        for s in sentences:
            s_clean = s.strip().lower()
            if len(s_clean) < 15:
                kept.append(s)
                continue
            h = hash(s_clean[:100])
            if h not in seen_sentences:
                seen_sentences.add(h)
                kept.append(s)
        return " ".join(kept)

    def _pack_context_and_sources(
        self,
        documents: List[NodeWithScore],
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Dynamically packs retrieved chunks within a strict token/character budget.
        - Deduplicates overlapping sentence fragments.
        - Caps individual chunks so one verbose chunk does not monopolize budget.
        - Guarantees prompt fits within context window, cutting local TTFT by 4x.
        """
        context_parts = []
        sources = []
        seen_sources = set()
        seen_sentences = set()
        current_chars = 0

        for doc in documents:
            raw_content = doc.node.get_content()
            if not raw_content or not raw_content.strip():
                continue

            metadata = doc.node.metadata or {}
            filename = metadata.get("filename", "Unknown Fragment")
            page = metadata.get("page_number") or metadata.get("page_label", "N/A")
            source_key = (filename, str(page))

            # Normalize unicode & math
            normalized_content = unicodedata.normalize("NFKC", raw_content)

            # Deduplicate sentences overlapping with prior chunks
            deduped_content = self._deduplicate_sentences(normalized_content, seen_sentences)
            if len(deduped_content.strip()) < 20:
                continue

            # Per-chunk slice cap ensures diverse coverage across sources
            chunk_slice = deduped_content[:self.MAX_CHUNK_CHARS].strip()
            header = f"### [DOCUMENT: {filename} | PAGE: {page}]\n"
            entry = f"{header}{chunk_slice}\n"

            # Check remaining budget
            if current_chars + len(entry) > self.MAX_CONTEXT_CHARS:
                if not context_parts:
                    context_parts.append(entry[:self.MAX_CONTEXT_CHARS])
                break

            context_parts.append(entry)
            current_chars += len(entry)

            if source_key not in seen_sources:
                sources.append({
                    "id": doc.node.id_,
                    "filename": filename,
                    "page_number": page,
                    "score": round(float(doc.score) if doc.score is not None else 0.0, 3),
                })
                seen_sources.add(source_key)

        return "\n".join(context_parts), sources[:4]

    async def stream_response(
        self,
        message: str,
        user_id: str,
        chat_id: str,
    ) -> AsyncGenerator[Union[str, Dict[str, Any]], None]:
        """Stream response with Redis query caching and bounded prefill context."""
        if self.index is None:
            yield "The neural intelligence vault is currently undergoing maintenance. Please try again in 60 seconds."
            return

        # 1. Check Redis query cache for instantaneous zero-latency replay
        cache_key = f"rag_cache:v2:{user_id}:{hashlib.sha256(message.strip().lower().encode()).hexdigest()}"
        if self.redis:
            try:
                cached_entry = await self.redis.get(cache_key)
                if cached_entry:
                    cached_data = json.loads(cached_entry)
                    yield {"type": "metadata", "sources": cached_data.get("sources", [])}
                    if cached_data.get("thinking"):
                        yield {"type": "thinking", "chunk": cached_data["thinking"]}
                    yield cached_data.get("content", "")
                    return
            except Exception:
                pass

        try:
            # 2. Retrieve relevant candidates
            relevant_docs = await self._retrieve_relevant_documents(
                message=message,
                user_id=user_id,
                top_k=6,
            )

            if not relevant_docs:
                yield "I'm sorry, I couldn't find any relevant information in your documents to answer your question."
                return

            # 3. Pack context strictly within budget (bounded token prefill = ultra-fast TTFT)
            context, sources = self._pack_context_and_sources(relevant_docs)
            yield {"type": "metadata", "sources": sources}

            # 4. Build prompt and stream
            prompt = self._build_prompt(message, context)

            full_response = ""
            full_thinking = ""
            async for chunk in self._generate_streaming_response(prompt):
                if isinstance(chunk, dict) and chunk.get("type") == "thinking":
                    full_thinking += chunk.get("chunk", "")
                elif isinstance(chunk, str):
                    full_response += chunk
                yield chunk

            # 5. Cache response in Redis with 1 hour TTL
            if self.redis and full_response:
                try:
                    cache_payload = json.dumps({
                        "sources": sources,
                        "thinking": full_thinking,
                        "content": full_response,
                    })
                    await self.redis.set(cache_key, cache_payload, ex=3600)
                except Exception:
                    pass

        except Exception as e:
            import traceback
            traceback.print_exc()
            error_msg = str(e) or type(e).__name__
            yield f"I'm sorry, an error occurred while processing your question: {error_msg}"

    async def _retrieve_relevant_documents(
        self,
        message: str,
        user_id: str,
        top_k: int = 6,
    ) -> List[NodeWithScore]:
        """Retrieve relevant documents using Hybrid Search (Dense + Sparse BM25) and FlashRank Reranking."""
        filters = MetadataFilters(
            filters=[
                MetadataFilter(key="user_id", value=str(user_id), operator=FilterOperator.EQ),
            ]
        )

        lower_msg = message.lower()
        is_broad = any(kw in lower_msg for kw in [
            "uploaded pdf", "the pdf", "this pdf", "the document", "this document",
            "overview", "summarize", "summary", "report", "what is inside", "what is present",
            "all details", "brief report", "details of", "complete details"
        ])

        effective_k = 6 if is_broad else top_k

        # 1. Dense Vector Retrieval (Nomic asymmetric query prefix)
        retrieval_query = f"search_query: {message}" if not message.startswith("search_query:") else message

        retriever = self.index.as_retriever(
            similarity_top_k=8,
            filters=filters,
        )

        try:
            dense_nodes = await retriever.aretrieve(retrieval_query)
        except Exception as e:
            print(f"Warning: Dense retrieval failed: {e}")
            dense_nodes = []

        # 2. Sparse BM25 Retrieval
        try:
            sparse_nodes = self.bm25_manager.search(message, user_id=str(user_id), top_k=8)
        except Exception as e:
            print(f"Warning: Sparse BM25 retrieval failed: {e}")
            sparse_nodes = []

        # 3. Reciprocal Rank Fusion (RRF, k=60)
        fused_nodes = reciprocal_rank_fusion(
            dense_nodes=dense_nodes,
            sparse_nodes=sparse_nodes,
            k=60,
            dense_weight=0.6,
            sparse_weight=0.4,
            top_n=10,
        )

        # For broad document overview questions, also prepend introductory / abstract chunks
        if is_broad and hasattr(self, "vector_store") and hasattr(self.vector_store, "_collection"):
            try:
                intro_res = self.vector_store._collection.get(
                    where={"user_id": str(user_id)},
                    limit=3
                )
                if intro_res and intro_res.get("documents"):
                    seen_ids = {n.node.id_ for n in fused_nodes}
                    for i, doc_text in enumerate(intro_res["documents"]):
                        doc_id = intro_res["ids"][i]
                        if doc_id not in seen_ids and doc_text.strip():
                            meta = intro_res["metadatas"][i] if intro_res.get("metadatas") else {}
                            node = TextNode(id_=doc_id, text=doc_text, metadata=meta)
                            fused_nodes.insert(0, NodeWithScore(node=node, score=0.95))
                            seen_ids.add(doc_id)
            except Exception as e:
                print(f"Warning: Failed to inject intro chunks: {e}")

        # 4. Precision Cross-Encoder Reranking (FlashRank)
        candidate_nodes = fused_nodes if fused_nodes else dense_nodes
        if not candidate_nodes:
            return []

        try:
            reranked_nodes = self.reranker.rerank(
                query=message,
                nodes=candidate_nodes,
                top_n=effective_k,
                score_threshold=0.05,
            )
            return reranked_nodes
        except Exception as e:
            print(f"Warning: FlashRank reranking stage failed: {e}. Using fused candidates.")
            return candidate_nodes[:effective_k]

    def _build_prompt(self, question: str, context: str) -> str:
        """Build prompt with question and context."""
        prompt = f"""You are Aura, a concise Domain-Expert Technical Assistant.
Answer the user question directly from the verified document knowledge below with high technical density and zero filler.

### Verified Document Knowledge:
{context}

### User Question:
{question}

### Directives:
- Be concise and high-signal (target 250-500 words; summarize tightly without repetition). Cover key methodology, formulas, and empirical metrics directly.
- Format all mathematical equations, variables, and formulas using valid LaTeX notation: inline math with $...$ (e.g. $S_{{ij}}$, $\\Omega_{{ij}}$, $\\mu$), and display equations on their own line with $$...$$.
- Cite specific sections, equations, pages, or figures from the document.
- NEVER include meta-disclaimers about "excerpts", "context limitations", or "having no access to the PDF".
- Use clean markdown headings and crisp bullet points.
"""
        return prompt

    async def _generate_streaming_response(
        self,
        prompt: str,
    ) -> AsyncGenerator[Union[str, Dict[str, Any]], None]:
        """Generate streaming response from Local Ollama separating thinking and response tokens."""
        response = await self.llm.astream_complete(prompt)

        async for chunk in response:
            think = chunk.additional_kwargs.get("thinking_delta")
            if think:
                yield {"type": "thinking", "chunk": think}

            if chunk.delta:
                yield chunk.delta

    async def add_document_to_index(
        self,
        nodes: List[TextNode],
    ) -> None:
        """Add parsed document nodes to local vector index and invalidate BM25 cache."""
        if not nodes:
            return

        self.index = VectorStoreIndex(
            nodes,
            storage_context=self.storage_context,
            embed_model=self.embed_model,
        )

        # Invalidate BM25 user cache
        if nodes and hasattr(self, "bm25_manager"):
            user_id = nodes[0].metadata.get("user_id") if hasattr(nodes[0], "metadata") else None
            self.bm25_manager.invalidate(user_id=user_id)

    async def delete_document_from_index(self, document_id: str, user_id: Optional[str] = None) -> None:
        """Delete all nodes associated with a document_id and user_id from local index and invalidate BM25 cache."""
        try:
            where_filter: Dict[str, Any] = {"document_id": str(document_id)}
            if user_id:
                where_filter = {"$and": [{"document_id": str(document_id)}, {"user_id": str(user_id)}]}

            if hasattr(self, "vector_store") and hasattr(self.vector_store, "_collection"):
                self.vector_store._collection.delete(where=where_filter)

            if hasattr(self, "bm25_manager"):
                self.bm25_manager.invalidate(user_id=user_id)
        except Exception as e:
            print(f"Warning: Failed to delete document {document_id} from Chroma: {e}")


_rag_service_instance: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or initialize singleton RAG service instance."""
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
    return _rag_service_instance
