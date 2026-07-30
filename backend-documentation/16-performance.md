# 16 Performance Analysis

Technical analysis of time/space complexity and API bottlenecks.

---

## 1. What is this? (Layman's Explanation)

Performance analysis helps us understand how our backend behaves under load. It measures execution times and resource consumption to identify bottlenecks.

This document details execution latency distributions and analyzes the complexity of our search and routing algorithms.

---

## 2. Intuition

Let's define some performance concepts:
*   **Latency**: The time it takes for a request to travel from the client to the server and back.
*   **Big-O Notation**: Mathematical representation of how algorithm execution times scale with data size.

---

## 3. Performance Profiling (Single Query Trace)

```text
Gemini API calls: ~1200ms (Bottleneck)
Neo4j query execution: ~24ms
MongoDB query execution: ~18ms
Regex text matches: ~8ms
Ranking calculations: ~2ms
Serialization: ~1ms
Total latency: ~1253ms
```

---

## 4. Complexity Analysis

*   **Neo4j vector search**: Cosine similarity matches run in $O(\log N)$ time using the hierarchical vector index.
*   **OSRM Route calculations**: $O(K \log K)$ route calculations.
*   **Mongoose Aggregation pipeline**: Spatial coordinates sorting runs in $O(N \log N)$ time.
