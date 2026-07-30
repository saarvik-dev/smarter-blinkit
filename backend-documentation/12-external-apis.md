# 12 External APIs

Technical specifications of external REST endpoints.

---

## 1. What is this? (Layman's Explanation)

No backend server operates in complete isolation. We integrate with third-party services to handle tasks like processing payments, running AI models, and calculating delivery routing.

This document describes how our backend communicates with Stripe, Gemini, Hugging Face, and OpenStreetMap APIs, detailing request/response formats and error recovery.

---

## 2. Intuition

Before reviewing payload details:
*   **External Integration**: Accessing features hosted on third-party servers using REST APIs.
*   **Routing Server**: Calculating delivery paths and distances using OpenStreetMap (OSRM).

---

## 3. Google Gemini AI API

*   **Headers**: `x-goog-api-key: [process.env.GEMINI_API_KEY]`
*   **Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`
*   **Request Payload**:
    ```json
    {
      "model": "models/gemini-embedding-001",
      "content": { "parts": [{ "text": "fresh organic milk" }] }
    }
    ```
*   **Response Payload**:
    ```json
    {
      "embedding": {
        "values": [0.0125, -0.0034, 0.0456, -0.0987]
      }
    }
    ```

---

## 4. Hugging Face Inference API

*   **Headers**: `Authorization: Bearer [process.env.HF_TOKEN]`
*   **Endpoint**: `POST https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions`
*   **Request Payload**:
    ```json
    {
      "messages": [
        { "role": "system", "content": "Return a valid JSON array of strings." },
        { "role": "user", "content": "movie night snacks" }
      ],
      "max_tokens": 150
    }
    ```

---

## 5. OpenStreetMap OSRM Server

*   **Endpoint**: `GET https://router.project-osrm.org/trip/v1/driving/[coords]?source=any&destination=last&roundtrip=false`
*   **Response Payload**:
    ```json
    {
      "code": "Ok",
      "trips": [
        {
          "geometry": "ey1zH...",
          "duration": 1800.5,
          "distance": 12500.2
        }
      ]
    }
    ```
