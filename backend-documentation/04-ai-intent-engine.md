# 04 AI Intent Engine

Detailed description of the AI processing pipeline for unstructured recipe and meal planning requests.

---

## 1. What is this? (Layman's Explanation)

When a user types "I want to make pasta for 4 people" in a shopping app, the system needs to understand what they mean. The app can't search a product catalog for "pasta for 4 people" directly because there isn't a product with that name.

The AI Intent Engine acts as a translator. It takes unstructured requests and extracts a list of concrete grocery items with quantities. It then searches our product catalog for those items, resolving them to actual database IDs that the user can add to their cart.

---

## 2. Intuition

Before diving into the implementation, let's cover some AI routing concepts:
*   **Generative AI**: We use Gemini to extract structured lists from plain text prompts.
*   **Multi-Model Fallbacks**: If our primary AI model fails (due to network errors or rate limits), the router falls back to alternative models or local regex parsing to ensure the request is still processed.
*   **Vector Embeddings**: A vector embedding is a list of numbers representing the semantic meaning of a word. This allows the system to match search queries with products that are conceptually similar, even if they don't share exact keywords.

---

## 3. Detailed Execution Trace

When a buyer submits a request to `POST /api/ai/recipe-agent`, the backend executes the following workflow:

1.  **Entry**: Express gateway catches HTTP request at [server.js](file:///d:/smarter-blinkit/backend/server.js).
2.  **Routing & Middleware**: Binds headers, validates CORS, parses JSON body payload, and verifies JWT (`protect`).
3.  **Prompt Formulation**: Binds the system prompt to the user input inside [routes/ai.js](file:///d:/smarter-blinkit/backend/routes/ai.js).
4.  **AI Routing Call**: Executes `aiRouter.generateText` in [services/aiRouter.js](file:///d:/smarter-blinkit/backend/services/aiRouter.js).
    *   Attempts primary model (`gemini-2.5-flash`).
    *   If rate-limited or fails (e.g. 429 quota errors), falls back to secondary model (`gemini-2.5-pro`).
    *   If both fail, falls back to Hugging Face serverless instance (model: `Qwen/Qwen2.5-72B-Instruct`).
    *   If all external models fail, triggers the stop-words regex parser locally.
5.  **Response Extraction**: Isolates the JSON array block using regular expressions:
    ```javascript
    const jsonMatch = text.trim().match(/\[[\s\S]*\]/);
    ```
6.  **Product Resolution**: Iterates through the parsed ingredients list:
    *   Queries MongoDB first using exact regex on `name` or `category` (`searchByKeyword`).
    *   If no matching product is found, calls `generateEmbedding` using `gemini-embedding-001` to get a vector embedding.
    *   Queries Neo4j's vector index (`product_embeddings`) for semantic matches with a minimum score of `0.78` (`RECIPE_SEMANTIC_MIN_SCORE`).
    *   Retrieves matching product details from MongoDB, applying geographic and shop ID filters if requested.
7.  **Response Serialization**: Formats the final JSON response containing successful matches, alternative options, and unmapped ingredients.

---

## 4. System Call Graph

```text
POST /api/ai/recipe-agent
 └── protect & requireRole('buyer')
      └── router.post()
           ├── aiRouter.generateText(Prompt)
           │    ├── gemini-2.5-flash (Attempt 1)
           │    ├── gemini-2.5-pro (Attempt 2 - Fallback)
           │    └── Hugging Face Qwen 72B (Attempt 3 - Fallback)
           ├── regex.match(/\[[\s\S]*\]/)
           └── for (ingredient of ingredients)
                ├── searchByKeyword(Query) -> Product.find (exact regex)
                └── generateEmbedding(Query) -> gemini-embedding-001 (vector fallback)
                     └── neo4jService.semanticSearch(vector, limit, minScore)
                          └── Cypher: CALL db.index.vector.queryNodes()
                               └── Product.find({ _id: { $in: productIds } })
```

### Call Trail Analysis

The call graph above details the execution sequence when a buyer requests meal planning recommendations. Let's trace it step-by-step:
*   First, the HTTP request is authenticated to verify buyer permissions.
*   Once authorized, the request passes to the route handler, which delegates execution to the `aiRouter` utility to query Gemini models (with Hugging Face fallback).
*   The raw LLM output is parsed using regular expressions to extract structured JSON containing ingredient names, quantities, and queries.
*   For each ingredient, the engine runs a fast keyword-matching query in MongoDB. If no matches are found, it falls back to a semantic vector search.
*   This semantic search generates a 3072-dimensional vector embedding, queries Neo4j's vector index using cosine similarity, and loads the matching product details from MongoDB.

---

## 5. Data Transformations & Memory Evolution

This trace maps the data transformation from raw request input to structured JSON response:

```text
"Make pizza for 4 people" (Raw prompt string)
  │
  ├── [Prompt construction: systemPrompt + prompt]
  ▼
"[System Prompt] User request: Make pizza for 4 people"
  │
  ├── [AI Inference: aiRouter.generateText]
  ▼
"```json\n[ {\"item\": \"flour\", \"packsToBuy\": 1, \"amountText\": \"2 kg\", \"searchQuery\": \"wheat flour\"} ]\n```"
  │
  ├── [Regex extraction & JSON parsing]
  ▼
[ { "item": "flour", "packsToBuy": 1, "amountText": "2 kg", "searchQuery": "wheat flour" } ]
  │
  ├── [Database Resolution: MongoDB Exact Regex & Neo4j Vector Index Search]
  ▼
[
  {
    "ingredient": { "item": "flour", "packsToBuy": 1, "amountText": "2 kg", "searchQuery": "wheat flour" },
    "bestMatch": { "_id": "64ca8210f", "name": "Organic Wheat Flour", "price": 45, "stock": 100 },
    "alternatives": [ { "_id": "64ca8211a", "name": "All Purpose Flour", "price": 35 } ],
    "suggestedQuantity": 1,
    "addToCart": true
  }
]
```

### Memory Evolution Analysis

The evolution trace above shows how unstructured user prompts are transformed into structured database objects:
*   The system takes raw user prompts and prepends system-level prompts to construct the AI context.
*   This context is sent to the LLM, which returns a string containing markdown-wrapped JSON.
*   The regex engine isolates the JSON array block and parses it into structured JavaScript objects.
*   For each object, the system queries the database to match keywords and coordinates, resolving the search terms to actual MongoDB product IDs.
*   Finally, the system formats the resolved products, alternative options, and unmapped ingredients into a structured JSON response.

---

## 6. Engineering & Code Quality Review

*   **Tightly Coupled Routing**: All routing controllers, prompt definitions, Mongoose keyword lookups, and Neo4j vector fallback logic are hardcoded directly within [routes/ai.js](file:///d:/smarter-blinkit/backend/routes/ai.js).
    *   *Improvement*: Move business logic into a dedicated `AIProcessingService`.
*   **Sequential Database Queries**: The product resolution loop runs MongoDB and Neo4j queries sequentially (`await` inside a `for` loop), resulting in significant latency overhead.
    *   *Improvement*: Resolve product matches concurrently using `Promise.all()`.
