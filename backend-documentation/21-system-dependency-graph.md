# 21 System Dependency Graph

Visual map of dependencies across systems and databases.

---

## 1. What is this? (Layman's Explanation)

Dependency mapping visualizes connections between different modules in our application, ensuring developers understand how changes to one subsystem affect others.

This document includes a dependency flowchart showing relationships from client-side requests down to database indexes and external integrations.

---

## 2. Intuition

Before reviewing the graph:
*   **Dependency**: When one code module relies on another to function (e.g. controllers requiring database connection drivers).

---

## 3. Complete System Dependency Flow

```mermaid
flowchart TD
  Client[Web Client] -->|HTTP / WebSockets| Server[routes/server.js]
  
  subgraph Routing Gateway
    Server --> Auth[routes/auth.js]
    Server --> Prod[routes/products.js]
    Server --> Ord[routes/orders.js]
    Server --> AI[routes/ai.js]
    Server --> Pay[routes/payments.js]
  end

  subgraph Services Layer
    Prod --> Neo4j[services/neo4j.js]
    Ord --> SmartCart[services/smartCartService.js]
    AI --> AISwitch[services/aiRouter.js]
    AI --> Neo4j
    Pay --> StripeSDK[Stripe SDK]
  end

  subgraph Persistence & External Nodes
    SmartCart --> MongoDb[(MongoDB Atlas)]
    Neo4j --> Neo4jDb[(Neo4j Aura)]
    AISwitch --> GeminiAPI[Google Gemini REST API]
    AISwitch --> HFAPI[Hugging Face REST API]
    Ord --> OSRMAPI[OSRM Route Trip API]
  end
```

---

## 4. Dependency Descriptions

*   **routes/auth.js -> middleware/auth.js**: Depends on jwt verify to extract identities.
*   **routes/ai.js -> services/aiRouter.js**: Depends on the router to manage Gemini keys and model fallbacks.
*   **services/cartIntelligenceService.js -> services/neo4j.js**: Depends on the graph driver to execute cypher recommendation queries.
