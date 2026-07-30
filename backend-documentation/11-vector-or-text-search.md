# 11 Vector vs Text Search

Comparative analysis of semantic search methods in SmarterBlinkit.

---

## 1. What is this? (Layman's Explanation)

Search systems handle lookups in two ways: matching keywords exactly (text search) or understanding conceptual meanings (vector search).

This project uses a hybrid approach. It uses vector search to find conceptually related candidates, and keyword queries to boost exact matches. This ensures users find what they are looking for, even if they use different search terms.

---

## 2. Intuition

Let's look at the differences:
*   **Vector Search**: Uses multi-dimensional cosine distances to match queries based on semantic meaning.
*   **Text Search**: Uses string patterns to find exact matches.

---

## 3. Feature Analysis Matrix

| Feature Parameter | Vector Indexing (Semantic) | Regex Match Queries (Keyword) |
| :--- | :--- | :--- |
| **Search Mechanism**| Multi-dimensional cosine distance trees. | Substring pattern comparisons. |
| **Vocabulary** | Resolves synonyms, intentions, and contexts. | Matches spelling. |
| **Indexes** | Neo4j vector cosine index (`product_embeddings`). | MongoDB indexes (`name`, `category`). |
| **Computational Cost**| Low CPU cost ($O(\log N)$) once query vector is generated. | High CPU cost ($O(N)$ regex scanning). |
| **Latency** | 20-50ms query execution time (Gemini API embedding generation adds 1-2s). | 10-30ms database execution time. |

---

## 4. Search Strategy Analysis

*   **Hybrid Matching**: Vector searches capture semantic intent but can struggle with exact keyword matches. Keyword queries handle exact terms but fail to capture context.
*   **Optimized Strategy**: The backend implements a hybrid approach, using vector lookups to find relevant candidates and applying keyword matching to boost rankings for exact query matches.
