# 13 Data Models

Detailed documentation of Mongo schemas and Neo4j graph nodes.

---

## 1. What is this? (Layman's Explanation)

Data Models define how information is structured in our databases. Without a consistent schema, data can quickly become disorganized.

This document describes our MongoDB collection schemas (Mongoose) and Neo4j node structures, ensuring data remains organized and valid.

---

## 2. Intuition

Before reviewing models:
*   **Mongoose Schemas**: Schema validation templates that define field types and requirements in MongoDB.
*   **Graph Nodes**: Entities represented in Neo4j (such as products).

---

## 3. MongoDB Mongoose Schemas

*   **Product Schema**: Stores name, price, stock, category, barcode, and embedding vector.
*   **Order Schema**: Stores buyer, items, shopGroups, paymentId, and optimized route geometry.
*   **User Schema**: Stores name, email, role, password, address, coordinates, and biometric face credentials.
*   **ProductRatingStat Schema**: Stores seed rating, seed weight, user rating totals, and computed Bayesian final ratings.

---

## 4. Neo4j Graph Database Model

*   **Node**: `(:Product { id, name, category, embedding, salesCount, price })`
*   **Edges**:
    *   `[:SIMILAR_TO { score, embeddingScore, nameScore, categoryScore }]`
    *   `[:BOUGHT_WITH { count, weight }]`
