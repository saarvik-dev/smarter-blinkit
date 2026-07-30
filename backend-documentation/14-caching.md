# 14 Caching

Detailed analysis of caching performance and database indexing.

---

## 1. What is this? (Layman's Explanation)

Repeatedly running complex database queries or calling third-party APIs is expensive and increases application latency. Caching solves this by temporarily storing query results in memory.

This document analyzes our indexing strategies and outlines our plans to implement Redis caching to speed up high-volume queries.

---

## 2. Intuition

Let's cover caching concepts:
*   **In-Memory Storage**: Storing query results in RAM (using Redis) for near-instant access.
*   **Cache Invalidation**: Removing stale data from the cache when database records are updated.

---

## 3. Caching Infrastructure

The system relies on optimized database indexing and query boundaries to minimize latency:
*   **Database Query Optimization**: The backend runs queries within geographical constraints, narrowing searches to local stores to reduce database overhead.
*   **Rate-Limit Mitigations**: Embeddings are generated at product ingestion time and saved directly to the database, removing Gemini API call latency from user search paths.
*   **Redis Implementation Plan**: High-volume queries (like intent keyword expansion and geo-based search results) should be cached in Redis to reduce API latency.
