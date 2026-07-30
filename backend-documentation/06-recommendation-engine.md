# 06 Recommendation Engine

Deep dive into the graph-based recommendation algorithm and scoring equations.

---

## 1. What is this? (Layman's Explanation)

When a user views a product, recommending related items can improve their experience and increase sales. Product recommendations generally fall into two categories: "items frequently bought together" and "items with similar characteristics."

This project uses a graph database to manage recommendations. A graph database represents products as nodes, and purchases and similarities as connections (or edges) between them. This allows us to calculate product suggestions in real-time based on purchase history and attributes.

---

## 2. Intuition

Before reviewing the Cypher queries, let's cover graph concepts:
*   **Nodes**: Nodes are the entities in our graph (representing products).
*   **Relationships**: Relationships are the connections between nodes (such as `BOUGHT_WITH` or `SIMILAR_TO`).
*   **Co-occurrence**: If product A and product B are frequently purchased together, their relationship weight increases, making them more likely to be recommended to users.

---

## 3. Detailed Execution Trace

When a product detail page is requested, recommendations are fetched via `GET /api/products/:id/suggestions`:

1.  **Entry Point**: Express gateway catches HTTP request at [server.js](file:///d:/smarter-blinkit/backend/server.js).
2.  **Routing & Middleware**: Binds headers, CORS validation, and maps URL parameter `id` to `req.params.id`.
3.  **Source Verification**: Loads the source product name and category from MongoDB.
4.  **Graph Query Execution**:
    *   Invokes `getSuggestions` in [services/neo4j.js](file:///d:/smarter-blinkit/backend/services/neo4j.js).
    *   Finds co-purchased (`BOUGHT_WITH`) and similar (`SIMILAR_TO`) product nodes.
    *   Computes recommendation scores using weights and coordinates.
5.  **Mongoose Validation Filter**:
    *   Queries MongoDB to filter out products that are out of stock or marked unavailable.
6.  **Diversity Deduplication**:
    *   Filters out products with matching names to maintain recommendation diversity.
7.  **Serialization**: Formats and returns the final JSON list.

---

## 4. Call Graph

```text
GET /api/products/:id/suggestions
 └── router.get()
      ├── Product.findById(id).select('name category embedding')
      ├── neo4jService.getSuggestions(id)
      │    └── Cypher: MATCH (p:Product {id}) OPTIONAL MATCH (p)-[:BOUGHT_WITH]-() ...
      └── Product.find({ _id: { $in: suggestions.id }, stock: { $gt: 0 } })
```

### Call Trail Analysis

The call graph above details the execution sequence when a buyer views a product page. Let's trace it step-by-step:
*   First, the system verifies the target product, loading its name and category details from MongoDB.
*   Next, the controller calls `getSuggestions` in the Neo4j service. This executes a Cypher query to retrieve co-purchased and similar product nodes.
*   Once recommendation candidates are retrieved, the controller runs a MongoDB query to verify stock levels and availability, filtering out invalid items.
*   Finally, the controller deduplicates suggestions by name and returns the list of recommendations to the client.

---

## 5. Data Transformations & Memory Evolution

```text
"64ca8210f" (Source product ID)
  │
  ├── [Product.findById source metadata check]
  ▼
{ name: "Sourdough Bread", category: "Bakery", embeddingSize: 3072 }
  │
  ├── [Cypher Query: MATCH BOUGHT_WITH and SIMILAR_TO nodes]
  ▼
Records: [
  { id: "64ca8211a", name: "Amul Butter", boughtWithWeight: 4, similarWeight: 0, salesCount: 150 },
  { id: "64ca8211b", name: "Wheat Sourdough", boughtWithWeight: 0, similarWeight: 0.92, salesCount: 45 }
]
  │
  ├── [Cypher Score Formula Calculation]
  ▼
"64ca8211a" (Amul Butter) -> Score: (4 * 1.45) + (0 * 3.20) + (log10(150 + 1) * 0.45) = 5.80 + 0.98 = 6.78
"64ca8211b" (Wheat Sourdough) -> Score: (0 * 1.45) + (0.92 * 3.20) + (log10(45 + 1) * 0.45) = 2.94 + 0.74 = 3.68
  │
  ├── [Product.find database verification & name deduplication filter]
  ▼
[
  { "id": "64ca8211a", "name": "Amul Butter", "relationship": "BOUGHT_WITH", "weight": 6.78 },
  { "id": "64ca8211b", "name": "Wheat Sourdough", "relationship": "SIMILAR_TO", "weight": 3.68 }
]
```

### Memory Evolution Analysis

The trace above shows how recommendation data is processed in memory:
*   The product ID is verified against MongoDB, retrieving catalog details.
*   This details are sent to Neo4j to find related product nodes.
*   Recommendation scores are computed for each candidate based on bought-together history, attributes, and sales volume.
*   The candidates are filtered to verify stock levels, deduplicated to remove name duplicates, and returned as a list of recommendation objects.

---

## 6. Graph Matching Math Derivation

The recommendation score between product $p$ and candidate $c$ is computed using the following Cypher formula:

$$\text{Score} = (W_{bw} \times B(p, c)) + (W_{sim} \times Sim(p, c)) + (W_{sales} \times \log_{10}(c.salesCount + 1.0))$$

*   **Bought-With Weight ($W_{bw} = 1.45$)**: Captures purchase associations.
*   **Similarity Weight ($W_{sim} = 3.20$)**: Higher coefficient prioritizes semantic and attribute similarities, preventing recommendations from becoming purely popularity-driven.
*   **Popularity Dampening Prior ($W_{sales} = 0.45$)**: A logarithmic function $\log_{10}(\text{salesCount} + 1.0)$ accounts for sales volume without allowing highly popular items to dominate recommendations.
