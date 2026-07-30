# 05 Intent Search

Detailed trace of intent queries, semantic matching, and confidence score mapping.

---

## 1. What is this? (Layman's Explanation)

Traditional search systems match keywords exactly. If you search for "cough syrup" in an app that only has "cough medicine" in its catalog, the search will return zero results.

Intent Search solves this problem using semantic query expansion. It uses Gemini to analyze the intent behind a search query (like "I have a cold") and expands it into relevant terms (like "honey", "ginger tea", and "cough syrup"). This ensures users find relevant products even if they don't match the exact search query.

---

## 2. Intuition

Let's look at how query expansion works conceptually:
*   **Semantic Matching**: The vector database understands the meaning behind search terms, returning relevant results even if exact keywords aren't present.
*   **Cosine Similarity**: Cosine similarity is the mathematical formula used to calculate how close two vectors are in high-dimensional space.
*   **Ranking**: Results are sorted by keyword match count, semantic similarity, and popularity to ensure the most relevant products are displayed first.

---

## 3. Complete Execution Trace

1.  **Entry Point**: Express gateway catches HTTP request at [server.js](file:///d:/smarter-blinkit/backend/server.js).
2.  **Routing & Middleware**: Binds headers, CORS validation, parses JSON body payload, and verifies authentication keys.
3.  **Keyword Expansion**:
    *   Instructs Gemini (with Qwen fallback) to expand the query into specific keywords (maximum 8 terms).
    *   *Example*: "I have a cold" $\rightarrow$ `["honey", "ginger tea", "lemon", "vitamin c", "cough syrup"]`.
4.  **Vector Generation**:
    *   Calls the Gemini embedding service (`gemini-embedding-001`) to convert the query into a 3072-dimensional vector.
5.  **Neo4j Vector Search**:
    *   Queries Neo4j's vector index using Cosine Similarity, filtering for nodes with a score $\ge 0.78$ (`INTENT_SEMANTIC_MIN_SCORE`).
6.  **MongoDB Metadata Resolution**:
    *   Loads matched product details from MongoDB, applying geographic and shop ID filters.
    *   Calculates a semantic search ranking boost:
        *   Ranks 1 to 4: `count` is boosted by `3`.
        *   Ranks 5 to 8: `count` is boosted by `2`.
        *   Ranks 9 to 12: `count` is boosted by `1`.
7.  **MongoDB Keyword Search**:
    *   Queries MongoDB name and category fields (`$or` regex query) for each expanded keyword, incrementing the match count for matches.
8.  **Ranking & Sorting**:
    *   Sorts products by keyword match count, semantic score, and popularity.
9.  **Serialization**: Formats and returns the final JSON response.

---

## 4. Call Graph

```text
POST /api/ai/intent-search
 └── router.post()
      ├── aiRouter.generateText(searchPrompt) -> Expand intent to keywords
      ├── generateEmbedding(query) -> Convert query to 3072-dim queryVector
      ├── neo4jService.semanticSearch(queryVector, limit, minScore)
      │    └── Cypher: CALL db.index.vector.queryNodes('product_embeddings')
      ├── Product.find({ _id: { $in: productIds } }) -> Resolve product details
      └── for (kw of keywords)
           └── Product.find({ $or: [name, category] }) -> Match exact keyword
```

### Call Trail Analysis

The call graph above details the execution sequence for intent search queries. Let's trace it step-by-step:
*   The system takes user queries (like "I have a cold") and passes them to the AI router to expand the query into specific product keywords.
*   In parallel, the system converts the query into a 3072-dimensional vector embedding.
*   This vector embedding is used to run a semantic search query against Neo4j's vector index, finding conceptually related products.
*   The system then queries MongoDB to load details for these products, applying geographic and shop ID filters.
*   Next, the system loops through each expanded keyword, running Mongoose regex lookups to find exact matches.
*   Finally, the system combines and sorts all results, returning them to the client.

---

## 5. Data Transformations & Memory Evolution

```text
"I have a cold" (Raw query string)
  │
  ├── [Keyword Expansion Prompt via AI Router]
  ▼
["honey", "ginger tea", "lemon", "vitamin c", "cough syrup"]
  │
  ├── [Embedding Vector Generation]
  ▼
[0.0123, -0.0456, ..., 0.0089] (3072-length queryVector)
  │
  ├── [Neo4j Semantic Search queryNodes & MongoDB Load]
  ▼
Map(
  "64ca82101" => { product: { name: "Ginger Honey Tea" }, semanticScore: 0.89, count: 3 }
)
  │
  ├── [MongoDB Keyword Loop Matches and Count Boosts]
  ▼
Map(
  "64ca82101" => { product: { name: "Ginger Honey Tea" }, semanticScore: 0.89, count: 5 } // incremented
)
  │
  ├── [Sorting by count, semanticScore, and popularity]
  ▼
[ { "product": { "name": "Ginger Honey Tea" }, "matchedKeyword": "Semantic Match", "count": 5 } ]
```

### Memory Evolution Analysis

The trace above shows how search query data is transformed in memory:
*   The raw string query is expanded into an array of relevant keywords (e.g. honey, ginger tea).
*   The query is converted into a 3072-dimensional float vector.
*   This vector is sent to Neo4j, returning matching product IDs and similarity scores.
*   The system loads product details from MongoDB, mapping them to a data map using the product ID as key.
*   Keyword matching queries are executed, updating product counts inside the map.
*   Finally, the system converts the map into a sorted array of product objects, returning it to the client.

---

## 6. Engineering & Code Quality Review

*   **Duplicate Queries**: Keyword expansion queries can be highly repetitive (e.g. searching "I have a cold" multiple times).
    *   *Improvement*: Cache AI router responses using Redis to reduce token consumption and API latency.
*   **Excessive Database Operations**: The system performs a separate MongoDB query for each expanded keyword. An array of 8 keywords results in 8 sequential database roundtrips.
    *   *Improvement*: Combine keyword lookups into a single MongoDB query using an `$in` array regex structure.
