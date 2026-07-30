# 09 Product Data Flow

Comprehensive documentation of product creation, scraping, embedding generation, and graph database synchronization.

---

## 1. What is this? (Layman's Explanation)

Product information in our catalog comes from multiple sources, including seller uploads and our web scraping scraper. When a product is created or updated, we must update both MongoDB and Neo4j.

Product Data Flow is the pipeline that handles this. It saves catalog documents to MongoDB, requests vector embeddings from Gemini, updates Neo4j database nodes, and refreshes category similarity links to maintain accurate recommendations.

---

## 2. Intuition

Let's review the data flow concept:
*   **Ingestion Pipeline**: The process of validating, cataloging, and embedding new products before publishing them.
*   **Embedding Generation**: Converting product descriptions into numerical vectors so they can be matched during semantic searches.
*   **Graph Synchronization**: Upserting node properties in Neo4j to ensure recommendations contain correct prices and stock details.

---

## 3. Complete Execution Trace

1.  **Ingestion**: Product payload is received via the web scraper pipeline.
2.  **Mongoose Persistence**: Validates properties and saves product document to MongoDB.
3.  **Embedding Pipeline trigger**:
    *   Invokes `generateAndSyncEmbedding` in [routes/products.js](file:///d:/smarter-blinkit/backend/routes/products.js).
    *   Introduces a 2-second rate-limiting delay to protect free tier API usage.
    *   Converts product name, category, and description into a vector embedding using `gemini-embedding-001`.
    *   Saves the generated embedding vector to the MongoDB product document.
4.  **Neo4j Graph Synchronization**:
    *   Invokes `upsertProduct` in [services/neo4j.js](file:///d:/smarter-blinkit/backend/services/neo4j.js).
    *   Creates or updates the product node, saving metadata properties (price, salesCount, name, category, vector embedding).
5.  **Similarity Relationship Mapping**:
    *   Invokes `refreshSimilarRelationships` in [services/neo4j.js](file:///d:/smarter-blinkit/backend/services/neo4j.js).
    *   Finds matching category candidates in MongoDB.
    *   Computes Cosine, Jaccard, and Category similarity scores, and calculates weighted averages.
    *   Saves the top 10 candidates with similarity scores $\ge 0.42$ in Neo4j using the `SIMILAR_TO` relationship.

---

## 4. Call Graph

```text
Product Ingestion (Scrape/Seller creation)
 └── Product.save() -> MongoDB
      └── generateAndSyncEmbedding(product)
           ├── delay(2000) -> Wait to avoid rate limits
           ├── getGenerativeModel('gemini-embedding-001') -> Get embedding
           ├── product.save() -> Update MongoDB embedding column
           ├── neo4jService.upsertProduct(productId, name, category, embedding, metadata)
           │    └── Cypher: MERGE (p:Product {id}) SET p.embedding = $embedding
           └── neo4jService.refreshSimilarRelationships(productId)
                ├── Product.find(category candidates)
                ├── compute similarities (Jaccard, Cosine, Weighted)
                └── neo4jService.createSimilarRelationship(source, candidate, scores)
                     └── Cypher: MATCH (a), (b) MERGE (a)-[r:SIMILAR_TO]->(b)
```

### Call Trail Analysis

The call graph above details the execution sequence when a product is added or updated:
*   First, the new product document is written to MongoDB.
*   Once saved, `generateAndSyncEmbedding` is triggered. This introduces a 2-second rate-limiting delay to protect free tier API usage.
*   The product details are sent to Gemini to generate a vector embedding.
*   This vector embedding is saved to the MongoDB product document.
*   Next, `upsertProduct` is called to create or update the product node in Neo4j, saving the vector embedding.
*   Finally, `refreshSimilarRelationships` computes similarity scores with matching category candidates and maps the relationships in Neo4j.

---

## 5. Data Transformations & Memory Evolution

```text
Product Payload: { name: "Tomato Juice", category: "Beverages", price: 80 }
  │
  ├── [Product.save MongoDB persist]
  ▼
MongoDB Doc: { _id: ObjectId("64ca8a2"), name: "Tomato Juice", price: 80, salesCount: 0 }
  │
  ├── [generateAndSyncEmbedding text payload creation]
  ▼
"Tomato Juice Beverages [No Description]" (Concatenated metadata text)
  │
  ├── [Gemini embedding model conversion]
  ▼
[0.0112, -0.0543, ..., 0.0891] (3072-length float vector array)
  │
  ├── [neo4jService.upsertProduct graph database sync]
  ▼
Node: (p:Product { id: "64ca8a2", name: "Tomato Juice", embedding: [3072 float values] })
  │
  ├── [neo4jService.refreshSimilarRelationships category matching & scoring]
  ▼
Candidate: "64ca8c5" (Orange Juice) -> CategoryScore: 1, NameScore: 0.5, CosineScore: 0.81
WeightedScore: (0.81 * 0.56) + (1 * 0.24) + (0.5 * 0.20) = 0.45 + 0.24 + 0.10 = 0.79 >= 0.42 (valid similarity)
  │
  ├── [SIMILAR_TO relationship mapping]
  ▼
Relationship: (:Product {id: "64ca8a2"})-[:SIMILAR_TO { score: 0.79 }]->(:Product {id: "64ca8c5"})
```

### Memory Evolution Analysis

The trace above shows how product data is transformed during ingestion:
*   The raw scraper payload is written to MongoDB.
*   The system concatenates the product's name, category, and description into a single string.
*   This string is sent to Gemini, returning a 3072-dimensional vector.
*   The vector embedding is saved to the MongoDB product document.
*   Next, the vector embedding and metadata are synced to Neo4j.
*   Similarity scores are computed with category candidates, and the top candidates are linked in Neo4j using the `SIMILAR_TO` relationship.

---

## 6. Engineering & Code Quality Review

*   **Blocking Inline AI Execution**: Generating embeddings synchronously during product ingestion blocks thread execution, increasing scraping route latency.
    *   *Improvement*: Move embedding generation and graph synchronization tasks to a background queue worker.
