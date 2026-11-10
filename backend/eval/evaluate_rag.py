"""Automated Quantitative Evaluation Suite for RAG Retrieval & Ranking Strategies."""

import os
import sys
import json
import time
import asyncio
from typing import List, Dict, Any, Tuple

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.rag_service import get_rag_service
from app.services.hybrid_search import reciprocal_rank_fusion
from llama_index.core.vector_stores.types import MetadataFilters, MetadataFilter, FilterOperator


def evaluate_chunk_coverage(retrieved_nodes, target_keywords: List[str]) -> Tuple[float, int]:
    """
    Computes keyword coverage ratio and first relevant rank (1-indexed).
    Returns (coverage_ratio, first_hit_rank).
    """
    if not retrieved_nodes:
        return 0.0, 0

    all_text = " ".join([n.node.get_text().lower() for n in retrieved_nodes])
    matched_keywords = sum(1 for kw in target_keywords if kw.lower() in all_text)
    coverage = matched_keywords / len(target_keywords) if target_keywords else 1.0

    # Determine first relevant chunk rank
    first_hit_rank = 0
    for rank, node in enumerate(retrieved_nodes, start=1):
        chunk_text = node.node.get_text().lower()
        if any(kw.lower() in chunk_text for kw in target_keywords):
            first_hit_rank = rank
            break

    return coverage, first_hit_rank


async def run_evaluation():
    """Runs comparative evaluation across 3 retrieval pipelines."""
    gt_path = os.path.join(os.path.dirname(__file__), "ground_truth.json")
    if not os.path.exists(gt_path):
        print(f"Error: {gt_path} not found")
        return

    with open(gt_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)

    rag = get_rag_service()
    if not rag or not rag.vector_store:
        print("Error: RAG service vector store not available")
        return

    # Discover active user_id from Chroma collection
    res = rag.vector_store._collection.get(limit=1, include=["metadatas"])
    if not res or not res.get("metadatas") or not res["metadatas"][0].get("user_id"):
        print("Error: No indexed documents found in ChromaDB collection")
        return

    user_id = res["metadatas"][0]["user_id"]
    print(f"Evaluating on user_id: {user_id} with {len(ground_truth)} domain-expert test queries...")

    filters = MetadataFilters(
        filters=[MetadataFilter(key="user_id", value=str(user_id), operator=FilterOperator.EQ)]
    )

    strategies = ["Baseline (Dense Only)", "Hybrid (Vector + BM25)", "Hybrid + FlashRank Reranker"]
    metrics: Dict[str, Dict[str, Any]] = {
        s: {"latencies": [], "hit_at_1": 0, "hit_at_3": 0, "hit_at_4": 0, "mrr_sum": 0.0, "coverage_sum": 0.0}
        for s in strategies
    }

    retriever = rag.index.as_retriever(similarity_top_k=8, filters=filters)

    for item in ground_truth:
        q = item["question"]
        kws = item["keywords"]

        # --- Strategy 1: Dense Only ---
        t0 = time.perf_counter()
        query_dense = f"search_query: {q}"
        dense_nodes = await retriever.aretrieve(query_dense)
        lat_dense = (time.perf_counter() - t0) * 1000
        nodes_s1 = dense_nodes[:4]
        cov_s1, rank_s1 = evaluate_chunk_coverage(nodes_s1, kws)

        # --- Strategy 2: Hybrid (Vector + BM25 with RRF) ---
        t0 = time.perf_counter()
        sparse_nodes = rag.bm25_manager.search(q, user_id=str(user_id), top_k=8)
        fused_nodes = reciprocal_rank_fusion(dense_nodes, sparse_nodes, k=60, top_n=8)
        lat_hybrid = (time.perf_counter() - t0) * 1000 + lat_dense
        nodes_s2 = fused_nodes[:4]
        cov_s2, rank_s2 = evaluate_chunk_coverage(nodes_s2, kws)

        # --- Strategy 3: Hybrid + FlashRank Reranker ---
        t0 = time.perf_counter()
        reranked = rag.reranker.rerank(query=q, nodes=fused_nodes, top_n=4, score_threshold=0.05)
        lat_rerank = (time.perf_counter() - t0) * 1000 + lat_hybrid
        nodes_s3 = reranked[:4]
        cov_s3, rank_s3 = evaluate_chunk_coverage(nodes_s3, kws)

        # Record metrics
        runs = [
            ("Baseline (Dense Only)", nodes_s1, cov_s1, rank_s1, lat_dense),
            ("Hybrid (Vector + BM25)", nodes_s2, cov_s2, rank_s2, lat_hybrid),
            ("Hybrid + FlashRank Reranker", nodes_s3, cov_s3, rank_s3, lat_rerank),
        ]

        for s_name, nodes, cov, rank, lat in runs:
            m = metrics[s_name]
            m["latencies"].append(lat)
            m["coverage_sum"] += cov
            if rank == 1:
                m["hit_at_1"] += 1
            if 0 < rank <= 3:
                m["hit_at_3"] += 1
            if 0 < rank <= 4:
                m["hit_at_4"] += 1
            if rank > 0:
                m["mrr_sum"] += 1.0 / rank

    N = len(ground_truth)
    summary_rows = []

    print("\n" + "=" * 80)
    print("BENCHMARK RESULTS SUMMARY (N = 8 Domain-Expert Physics Queries)")
    print("=" * 80)
    header = f"{'Strategy':<30} | {'Hit@1':<8} | {'Hit@3':<8} | {'Hit@4':<8} | {'MRR':<8} | {'Recall':<8} | {'p50 Lat (ms)':<12}"
    print(header)
    print("-" * 80)

    for s_name in strategies:
        m = metrics[s_name]
        hit1 = (m["hit_at_1"] / N) * 100
        hit3 = (m["hit_at_3"] / N) * 100
        hit4 = (m["hit_at_4"] / N) * 100
        mrr = m["mrr_sum"] / N
        recall = (m["coverage_sum"] / N) * 100
        lat_sorted = sorted(m["latencies"])
        p50_lat = lat_sorted[len(lat_sorted) // 2]

        row_str = f"{s_name:<30} | {hit1:>6.1f}% | {hit3:>6.1f}% | {hit4:>6.1f}% | {mrr:>8.3f} | {recall:>6.1f}% | {p50_lat:>10.1f}ms"
        print(row_str)
        summary_rows.append({
            "strategy": s_name,
            "hit_at_1": f"{hit1:.1f}%",
            "hit_at_3": f"{hit3:.1f}%",
            "hit_at_4": f"{hit4:.1f}%",
            "mrr": f"{mrr:.3f}",
            "recall": f"{recall:.1f}%",
            "p50_latency": f"{p50_lat:.1f}ms",
        })

    print("=" * 80)

    # Save summary as JSON for reporting
    out_json = os.path.join(os.path.dirname(__file__), "benchmark_results.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(summary_rows, f, indent=2)

    return summary_rows


if __name__ == "__main__":
    asyncio.run(run_evaluation())
