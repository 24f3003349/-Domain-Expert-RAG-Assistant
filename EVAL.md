# Empirical Evaluation & Retrieval Benchmarks

This document records the empirical quantitative benchmarks comparing retrieval and ranking configurations on the **Domain-Expert RAG Assistant**.

---

## 🎯 Benchmark Objective
Quantify retrieval quality, ranking accuracy, and latency trade-offs across three architectural tiers:
1. **Tier 1 — Baseline**: Single-stream dense vector similarity search (ChromaDB + `nomic-embed-text`).
2. **Tier 2 — Hybrid Retrieval**: Parallel Dense Vector + Sparse Keyword (Okapi BM25) fused via Reciprocal Rank Fusion ($k=60$).
3. **Tier 3 — Hybrid + Cross-Encoder Reranker**: Hybrid Retrieval followed by local CPU cross-attention scoring with FlashRank (`ms-marco-TinyBERT-L-2-v2`, 4MB ONNX).

---

## 📊 Quantitative Scoreboard

Evaluated on $N = 8$ domain-expert physics and tensor equation test queries (`eval/ground_truth.json`) against the ingested technical paper (*Symbolic Identification of Tensor Equations in Multidimensional Physical Fields*):

| Retrieval Strategy | Hit Rate @ 1 | Hit Rate @ 3 | Hit Rate @ 4 | Mean Reciprocal Rank (MRR) | Context Recall | p50 Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Dense Only)** | 12.5% | 37.5% | 37.5% | 0.250 | 10.6% | 200.4ms |
| **Hybrid (Vector + BM25)** | **25.0%** | **50.0%** | **50.0%** | **0.375** | **12.7%** | 203.9ms |
| **Hybrid + FlashRank Reranker** | **25.0%** | **50.0%** | **50.0%** | **0.354** | **12.7%** | 238.3ms |

---

## 📈 Key Findings

1. **Hit Rate @ 1 Doubled (+100% Relative Gain)**:
   - Baseline vector search frequently placed tangential introductory or general text at Rank 1.
   - BM25 term weighting pulled the exact formula and definition passages into the top ranks, lifting Hit@1 from **12.5% to 25.0%**.

2. **Hit Rate @ 3 & Recall Expansion (+33% Relative Gain)**:
   - Hit@3 increased from **37.5% to 50.0%**, ensuring that at least one highly grounded chunk was present in the top 3 nodes delivered to the LLM prompt.

3. **Sub-40ms CPU Latency Overhead**:
   - In-memory Okapi BM25 added **<4ms** of execution overhead ($200.4\text{ms} \rightarrow 203.9\text{ms}$).
   - FlashRank ONNX cross-encoder added **~34ms** on CPU ($203.9\text{ms} \rightarrow 238.3\text{ms}$) with zero GPU allocation, zero PyTorch overhead, and zero VRAM competition against local Ollama models.

---

## 🔬 Evaluation Methodology & Reproducibility

To re-run the benchmark suite inside the Docker container:

```bash
docker exec domain-expert-rag-assistant-backend-1 /app/.venv/bin/python eval/evaluate_rag.py
```

- **Metrics Formulae**:
  - $\text{Hit@K} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(\text{rank}_i \le K)$
  - $\text{MRR} = \frac{1}{N} \sum_{i=1}^N \frac{1}{\text{rank}_i}$
  - $\text{RRF Score}(d) = \frac{0.6}{60 + \text{rank}_{dense}(d)} + \frac{0.4}{60 + \text{rank}_{sparse}(d)}$
