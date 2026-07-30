# 17 Environment Config

Configuration variables and credentials.

---

## 1. What is this? (Layman's Explanation)

A backend server requires credentials, access tokens, and database connection strings to run. Storing these values in code is a security risk.

Instead, we use environment variables. Environment variables are system-level key-value pairs loaded at runtime, keeping credentials secure and separate from our code.

---

## 2. Intuition

Before reviewing variables:
*   **Environment Variables**: Key-value pairs loaded at runtime to configure connection strings and credentials securely.

---

## 3. Environment Variable Reference

*   `MONGODB_URI`: Connection string for MongoDB Atlas.
*   `NEO4J_URI`: Bolt URI for Neo4j database instances.
*   `NEO4J_USERNAME`: Graph connection username.
*   `NEO4J_PASSWORD`: Graph connection credentials.
*   `GEMINI_API_KEY`: Developer API key for generative tasks.
*   `HF_TOKEN`: Hugging Face Inference token (fallback).
*   `STRIPE_SECRET_KEY`: Secret API key for transaction validation.
*   `PAYMENT_MODE`: Mode settings: `stripe` or `mock`.
*   `JWT_SECRET`: Key used for signing login tokens.
