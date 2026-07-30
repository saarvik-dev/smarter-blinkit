# 03 API Architecture

Comprehensive endpoints configuration registry, parameters, middleware boundaries, and HTTP response schemas.

---

## 1. What is this? (Layman's Explanation)

API Architecture defines how different systems communicate. In this project, the frontend client and backend gateway use HTTP requests to exchange data.

Think of our API architecture as the contract between the frontend and the backend. It specifies the available endpoints (such as `/api/products/search`), the parameters they expect (like query strings and coordinates), and the JSON responses they return. Having a well-defined API structure ensures that client-side updates don't break database implementations.

---

## 2. Intuition

Before diving into the schemas, let's cover some API design concepts:
*   **Endpoints**: Endpoints are unique URLs that represent specific resources (like products or orders).
*   **Request Payloads**: Payloads are JSON objects sent in the body of HTTP requests to transmit data (like payment details).
*   **HTTP Status Codes**: Status codes are standard three-digit numbers indicating request results (e.g. `201 Created` or `409 Conflict`).

---

## 3. Global API Map

| Path | Method | Middlewares | Inputs | Outputs | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | None | `name`, `email`, `password`, `role`, `location` | `success`, `token`, `user` | User account onboarding. |
| `/api/auth/login` | POST | None | `email`, `password` | `success`, `token`, `user` | Traditional credentials verification. |
| `/api/auth/register-face`| POST | `protect` | `photo` (Base64) | `success`, `faceId` | Registers biometric face credentials. |
| `/api/auth/login-face` | POST | None | `email`, `photo` (Base64) | `success`, `token`, `user` | Biometric face login. |
| `/api/products/search` | GET | None | `q`, `lat`, `lng`, `category`, `shopId`, `nearbyOnly` | `success`, `count`, `products`| Proximity-based search grid. |
| `/api/products/:id/suggestions`| GET | None | Params: `id` | `[ { id, name, relationship, weight } ]` | Similarity and purchase recommendations. |
| `/api/orders` | POST | `protect`, `requireRole('buyer')` | `items`, `deliveryAddress`, `deliveryLocation`, `paymentMode`, `paymentId` | `success`, `order` | Place order and split cart. |
| `/api/ai/recipe-agent`| POST | `protect`, `requireRole('buyer')` | `prompt`, `lat`, `lng`, `nearbyOnly`, `shopId` | `success`, `ingredients`, `cartItems`, `notFound` | Natural language recipe mapping. |
| `/api/ai/intent-search`| POST | None | `query`, `lat`, `lng`, `nearbyOnly`, `shopId` | `success`, `expandedKeywords`, `results` | Semantic intent keyword search. |
| `/api/payments/create-intent`| POST | `protect` | `amount`, `currency` | `success`, `clientSecret`, `mode`| Stripe or Mock payment intent. |
| `/api/reviews/create` | POST | `protect` | `productId`, `rating`, `reviewText` | `success`, `review`, `ratingSummary` | Bayesian review entry. |

---

## 4. API Input/Output Schemas

### POST `/api/payments/create-intent`
*   **Request Payload**:
    ```json
    {
      "amount": 499.50,
      "currency": "inr"
    }
    ```
*   **Response Payload**:
    ```json
    {
      "success": true,
      "clientSecret": "pi_3M3eF0LkdIwHu7ix1a2b3c_secret_XYZ",
      "paymentIntentId": "pi_3M3eF0LkdIwHu7ix1a2b3c",
      "amount": 499.50,
      "currency": "inr",
      "mode": "stripe"
    }
    ```

---

## 5. Detailed Request Trace: Biometric Recognition (`POST /api/auth/login-face`)

Here is what happens during a Face ID login:

1.  **Entry Point**: Express gateway catches HTTP request at [server.js](file:///d:/smarter-blinkit/backend/server.js).
2.  **Routing & Middleware**: Binds headers, CORS validation, and mounts routes.
3.  **Authentication**: Routes to `login-face` in [routes/auth.js](file:///d:/smarter-blinkit/backend/routes/auth.js).
4.  **Database Lookup**: Queries MongoDB User collection for `email` matching.
5.  **Vector Processing**: Calls the face verification engine to compare user's uploaded `photo` string with database biometric descriptors.
6.  **Token Signature**: If verified, signs a new JWT token using `process.env.JWT_SECRET`.
7.  **Response**: Returns `success: true` alongside token and user object.
