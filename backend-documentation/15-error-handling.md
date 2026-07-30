# 15 Error Handling

Technical review of global exception boundaries, try/catch patterns, and failover designs.

---

## 1. What is this? (Layman's Explanation)

In software development, errors are inevitable. A robust backend must handle failures—like database connection drops or API timeouts—without crashing.

This document describes our error handling strategy, detailing global exception boundaries, try/catch patterns, and fallback logic designed to keep the server running during failures.

---

## 2. Intuition

Before reviewing details:
*   **Exception Boundary**: Centralized error handlers that catch unexpected issues and return friendly messages to users.
*   **Failover Logic**: Alternative code paths that execute when primary services (like Stripe or Gemini) are down.

---

## 3. Exception Boundaries

*   **Process Boundaries**:
    `server.js` implements process-level recovery handlers to prevent server crashes on unexpected errors:
    ```javascript
    process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); });
    process.on('unhandledRejection', (err) => { console.error('Unhandled Promise Rejection:', err); });
    ```
*   **API Handler Try/Catch Protection**:
    Routes use try/catch blocks to ensure failures (e.g., API rate-limits) don't crash the server. For example:
    *   If Gemini/Hugging Face APIs fail, the AI engine falls back to local stop-word parsing and regex keywords.
    *   If Stripe fails, the system falls back to a simulated mock response.
    *   If OSRM routing fails, the system continues order placement using flat-distance estimation.
