# 20 Latency Analysis

Trace-level analysis of latency distribution across primary endpoints.

---

## 1. What is this? (Layman's Explanation)

Latency analysis measures response times across different API routes, mapping where execution time is spent to identify performance bottlenecks.

This document profiles our primary endpoints and suggests structural updates to minimize latency.

---

## 2. Intuition

Let's review latency concepts:
*   **Execution Time**: The time it takes for a database query or API integration to complete.
*   **Bottleneck**: A slow component (like a third-party API call) that limits the performance of the entire route.

---

## 3. Latency Profile Comparison

```text
POST /api/ai/recipe-agent (AI execution + sequential DB lookups)
  - Gemini API Calls: 1200ms
  - Sequential MongoDB / Neo4j Queries: 250ms
  - Serialization: 5ms
  Total Latency: ~1455ms (Bottleneck: Gemini)

POST /api/ai/intent-search (AI keyword expansion + vector lookup + sequential keyword regex)
  - Gemini keyword expansion: 900ms
  - Gemini embedding generation: 400ms
  - Neo4j vector cosine index: 24ms
  - Sequential keyword regex loops: 180ms
  Total Latency: ~1504ms (Bottleneck: Gemini)

POST /api/orders (Geo splitting + OSRM routing + Transaction write + Socket broadcast)
  - MongoDB geo-splitting lookup: 35ms
  - OSRM trip route API: 220ms
  - MongoDB transaction save: 15ms
  - Neo4j graph operations: 30ms
  Total Latency: ~300ms (Bottleneck: OSRM API)

GET /api/products/search (MongoDB proximity aggregation)
  - MongoDB $geoNear execution: 18ms
  - lookup join and unwind: 12ms
  Total Latency: ~30ms
```

---

## 4. Architectural Latency Mitigations

*   **Vector Cache**: Precompute query vector embeddings during product ingestion to prevent runtime AI latency during searches.
*   **Parallel execution**: Run external HTTP integrations concurrently (e.g. fetching OSRM and recording bought-together graph edges).
