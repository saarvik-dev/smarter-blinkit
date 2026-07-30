# 19 Backend Improvement Roadmap

A comprehensive, prioritised roadmap of optimization refactors and architectural upgrades for the SmarterBlinkit backend.

---

## 1. What is this? (Layman's Explanation)

An optimization roadmap is a plan for improving our backend's performance and scalability over time.

This document details optimization opportunities, estimates their difficulty and performance impact, and groups tasks into Quick Wins, Medium Refactors, and Major Architectural Changes.

---

## 2. Intuition

Before reviewing details:
*   **Roadmap**: A prioritized list of performance optimizations and refactoring tasks.
*   **Impact vs Difficulty**: Balancing implementation complexity against expected latency and resource savings.

---

## 3. Optimization Opportunities Matrix

| Improvement Task | Impact | Difficulty | Latency Change | Memory Impact | Priority | Type |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Asynchronous Event Ingestion Queue** | Critical | High | -1200ms on write paths | Moderate | High | Architectural |
| **Batch Keyword Search queries** | High | Low | -80ms on intent searches | Low | High | Quick Win |
| **Caching of Intent query results** | High | Low | -1100ms on repeats | Low | High | Quick Win |
| **Concurrent Product Resolution** | High | Medium | -150ms on recipe agents | Low | Medium | Refactor |
| **MongoDB Text Index integrations** | High | Low | -40ms on keyword lookups | Low | High | Quick Win |
| **Redis Heatmap calculations caching** | Medium | Medium | -30ms on analytics paths | Low | Medium | Refactor |
| **Export missing Neo4j read query** | Critical | Low | Restores replacements | Low | High | Quick Win |

---

## 4. Categorized Implementation Order

### Quick Wins (High Impact, Low Difficulty)
1.  **Export missing Neo4j read method**: Export the `read` method from `neo4j.js` to fix the replacements and cross-sells features.
2.  **Combine intent keywords queries**: Refactor the sequential MongoDB loops in intent searches into a single `$in` array search query.
3.  **Implement MongoDB Text Indexes**: Drop wildcard regex queries and implement a Text Index search pipeline on product names and categories.

### Medium Refactors (Moderate Difficulty)
1.  **Concurrent Product resolution**: Rewrite recipe resolution tasks in [routes/ai.js](file:///d:/smarter-blinkit/backend/routes/ai.js) to execute Mongoose queries concurrently using `Promise.all()`.
2.  **Implement Redis Caching Layer**: Setup Redis cache storage for high-volume static searches.

### Major Architectural Changes (High Difficulty)
1.  **Asynchronous Ingestion Worker**: Move Gemini embedding generation and Neo4j graph updates out of user request paths to an offline RabbitMQ queue.
