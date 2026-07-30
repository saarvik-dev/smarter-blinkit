# 10 Database Design

Exhaustive review of the persistence layer, constraints, and indexes.

---

## 1. What is this? (Layman's Explanation)

A database is the filing system of a backend application. If the database layout is messy, queries slow down, slowing the entire application.

This project uses a hybrid database design. MongoDB acts as our document database, storing users, shops, and products. Neo4j acts as our graph database, tracking product relationships. This approach allows us to scale transactional storage and graph recommendations independently.

---

## 2. Intuition

Before reviewing the index schemas, let's cover database indexing:
*   **Database Indexing**: Think of indexes as the index at the back of a book. Instead of reading every page to find a topic, you lookup the page number directly.
*   **Vector Cosine Index**: High-dimensional vector coordinates index that allows us to find conceptually similar products.

---

## 3. Database Schema Configurations

```text
               MongoDB (Transactional Documents)
  ┌────────────────────────────────────────────────────────┐
  │  Users Collection                                      │
  │   - _id, email, password, role, faceId                 │
  │  Products Collection                                   │
  │   - _id, name, price, stock, shopId, embedding [3072]  │
  │  Shops Collection                                      │
  │   - _id, name, location (2dsphere point)               │
  │  Orders Collection                                     │
  │   - _id, buyerId, items, deliveryLocation, route       │
  └───────────────────────────────────┬────────────────────┘
                                      │ Synced via Pipeline
                                      ▼
                   Neo4j Graph Database
  ┌────────────────────────────────────────────────────────┐
  │  Product Nodes: (:Product { id, name, category })      │
  │  Edges:                                                │
  │   - [:SIMILAR_TO {score, nameScore, embeddingScore}]   │
  │   - [:BOUGHT_WITH {count, weight}]                     │
  └────────────────────────────────────────────────────────┘
```

---

## 4. Database Indexes & Constraints

### MongoDB
*   **Products**: `{ shopId: 1 }`, `{ location: "2dsphere" }`, `{ barcode: 1 }`.
*   **Shops**: `{ location: "2dsphere" }`, `{ ownerId: 1 }`.
*   **Orders**: `{ buyerId: 1 }`, `{ status: 1 }`.

### Neo4j
*   **Unique Constraint**:
    ```cypher
    CREATE CONSTRAINT product_id_unique IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE
    ```
*   **Vector Index**:
    ```cypher
    CREATE VECTOR INDEX product_embeddings IF NOT EXISTS FOR (p:Product) ON (p.embedding)
    OPTIONS {indexConfig: {
        `vector.dimensions`: 3072,
        `vector.similarity_function`: 'cosine'
    }}
    ```
