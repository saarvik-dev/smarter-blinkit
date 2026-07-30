# 18 Deployment

Production configurations and startup procedures.

---

## 1. What is this? (Layman's Explanation)

Deployment is the process of publishing our application to production servers so users can access it.

This document describes our production configuration settings, database seeding scripts, and process manager setups.

---

## 2. Intuition

Let's cover deployment concepts:
*   **Process Manager (PM2)**: A utility that runs Node.js applications in the background, restarting them automatically if they crash.
*   **Database Seeding**: Populating initial collections with sample data to ensure the system is ready for use on launch.

---

## 3. Startup & Seeding

*   **Setup**: Deploy the codebase inside a process manager (such as PM2).
*   **Database Seeding**: The [seed.js](file:///d:/smarter-blinkit/backend/seed.js) script populates initial shops, products, and user accounts. It also uploads product entities directly to Neo4j.
*   **Indexing Initialization**:
    *   MongoDB: Indexes are built automatically on Mongoose model connection.
    *   Neo4j: The database initialization calls:
        ```javascript
        await neo4jService.initVectorIndex();
        ```
        This ensures vector indexes are configured and ready to parse incoming embedding requests.
