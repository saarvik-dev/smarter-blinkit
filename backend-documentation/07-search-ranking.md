# 07 Search Ranking

Technical documentation of the search ranking pipeline, geospatial calculations, and text matching rules.

---

## 1. What is this? (Layman's Explanation)

When a user searches for products (like "milk"), sorting the results by name isn't enough. We need to prioritize items based on location, availability, and popularity.

Search Ranking coordinates these factors using a MongoDB aggregation pipeline. It calculates the distance between the user and nearby stores, filters out unavailable items, matches search keywords, and returns an optimized list sorted by proximity or sales counts.

---

## 2. Intuition

Before reviewing the pipeline code, let's cover aggregation:
*   **Aggregation Pipeline**: Think of database aggregations as assembly lines in a factory. Data flows through stages (filtering, joining, and sorting) until the final result is produced.
*   **Geospatial Search**: Proximity search calculates coordinates on the Earth's surface to sort items by physical distance from the user.

---

## 3. Complete Execution Trace

When a user searches for products via `GET /api/products/search`, the query is processed as follows:

1.  **Entry Point**: Express gateway catches HTTP request at [server.js](file:///d:/smarter-blinkit/backend/server.js).
2.  **Routing & Middleware**: Binds headers, CORS validation, and parses request parameters (`q`, `lat`, `lng`, `category`, `shopId`, `nearbyOnly`).
3.  **Aggregation Pipeline Construction**:
    *   *Proximity*: Adds a `$geoNear` aggregation stage if user coordinates are provided. Matches active stock, computes distance properties, and inherits coordinates from the parent shop.
    *   *Category*: Filters by category.
    *   *Shop*: Filters by shop.
    *   *Text*: Matches query string (`q`) against `name`, `description`, and `category` fields using regex.
    *   *Nearby Constraint*: Filters out products with a distance $> 50\text{km}$ if `nearbyOnly` is enabled.
4.  **Lookup & Unwind**: Binds the parent shop document details (`$lookup` and `$unwind` on `shopId`).
5.  **Sorting**:
    *   If user coordinates are provided, sorts products by distance (`$sort: { distance: 1 }\`).
    *   If no coordinates are provided, sorts by popularity (`$sort: { salesCount: -1 }\`).
6.  **Response Serialization**: Formats and returns the matching products list.

---

## 4. Call Graph

```text
GET /api/products/search
 └── router.get()
      └── Product.aggregate(Pipeline)
           ├── $geoNear (Compute distance from lat/lng)
           ├── $match (Filter isAvailable, stock > 0, category, shopId)
           ├── $lookup (Join collections from shops)
           └── $sort (Sort by distance ASC or salesCount DESC)
```

### Call Trail Analysis

The call graph above details the MongoDB aggregation workflow:
*   First, if user coordinates are provided, the system executes `$geoNear` to sort products by physical distance.
*   Next, `$match` filters are applied to check availability and stock levels.
*   A `$lookup` stage joins the products and shops collections to retrieve store details, and `$unwind` flattens the result.
*   Finally, the pipeline sorts products by distance or popularity and returns the list.

---

## 5. Data Transformations & Memory Evolution

```text
q="milk", lat=26.9, lng=75.7, category="Dairy", nearbyOnly=true
  │
  ├── [Aggregation stage $geoNear]
  ▼
[ { "_id": "64ca821", "name": "Amul Milk", "distance": 1.25, "stock": 45, "isAvailable": true } ]
  │
  ├── [Aggregation stage $match category and coordinates constraints]
  ▼
[ { "_id": "64ca821", "name": "Amul Milk", "category": "Dairy", "distance": 1.25 } ]
  │
  ├── [Aggregation stage $lookup join and unwind shops]
  ▼
[
  {
    "_id": "64ca821",
    "name": "Amul Milk",
    "distance": 1.25,
    "shopId": { "_id": "64ca899", "name": "Ramesh Grocery Store", "rating": 4.8 }
  }
]
  │
  ├── [Aggregation stage $sort by distance]
  ▼
[ { "productId": "64ca821", "name": "Amul Milk", "distance": 1.25, "shopId": { "name": "Ramesh Grocery Store" } } ]
```

### Memory Evolution Analysis

The trace above shows how search results are transformed in memory:
*   The raw query parameters (coordinates and category) are passed to the aggregation pipeline.
*   The system executes `$geoNear`, appending a physical distance field to each product document.
*   Matching filters remove out-of-stock and unavailable items.
*   A lookup stage joins store data, replacing the shop ID with a populated store object.
*   Finally, the documents are sorted by distance and returned as a list of product objects.

---

## 6. Engineering & Code Quality Review

*   **Inefficient Search Execution**: Using a wildcard regex search (`new RegExp(term, 'i')`) inside aggregation pipelines is extremely expensive. It triggers full collection scans, bypassing traditional index strategies.
    *   *Improvement*: Create a MongoDB Text Index on `name`, `description`, and `category` fields, replacing regex matches with `$text` searches.
