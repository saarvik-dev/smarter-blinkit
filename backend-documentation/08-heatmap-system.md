# 08 Heatmap System

Documentation of the geospatial sales heatmap subsystem.

---

## 1. What is this? (Layman's Explanation)

For marketplace administrators, visual patterns can reveal where sales are growing. The Heatmap System calculates sales densities across different geographic areas, providing data for map visualizations.

The backend groups coordinates from successful orders, sums purchase values, and returns coordinates and intensity values. The frontend uses these values to display visual maps.

---

## 2. Intuition

Before reviewing the spatial code, let's cover scaling:
*   **Geospatial Aggregation**: Grouping orders by delivery location to calculate total sales values per area.
*   **Logarithmic Normalization**: High-volume areas can dominate visualizations. Logarithmic scaling normalizes these weights so that smaller points remain visible on the map.

---

## 3. Complete Execution Trace

Heatmap aggregates are fetched via `GET /api/admin/heatmap`:

1.  **Entry Point**: Express gateway catches HTTP request at [server.js](file:///d:/smarter-blinkit/backend/server.js).
2.  **Routing & Middleware**: Binds headers, CORS validation, and verifies admin privileges.
3.  **Geospatial Aggregation**:
    *   Queries active MongoDB Order documents containing delivery coordinates.
    *   Groups coordinates and computes sales totals to determine density weightings.
4.  **Logarithmic Scaling**:
    *   Normalizes sales totals using logarithmic scaling to prevent high-volume locations from skewing the visualization.
5.  **Response Serialization**: Formats and returns the coordinate heat points.

---

## 4. Call Graph

```text
GET /api/admin/heatmap
 └── requireRole('admin')
      └── router.get()
           └── Order.aggregate([ $match, $group, $project ])
                └── Group by coordinates, sum intensity (totalAmount)
```

### Call Trail Analysis

The call graph above details the heatmap aggregation workflow:
*   First, the system verifies admin permissions.
*   Once authorized, the router executes a MongoDB aggregation query on the orders collection.
*   This query filters for active orders and groups them by delivery coordinates, calculating total sales values per area.
*   Finally, the system projects coordinates and sales intensities into a structured JSON array and returns it to the client.

---

## 5. Data Transformations & Memory Evolution

```text
Inbound request GET /api/admin/heatmap
  │
  ├── [Order.aggregate MongoDB Aggregation Query]
  ▼
[
  { "deliveryLocation": { "coordinates": [75.78, 26.91] }, "totalAmount": 150.00, "status": "delivered" },
  { "deliveryLocation": { "coordinates": [75.78, 26.91] }, "totalAmount": 350.00, "status": "delivered" }
]
  │
  ├── [$group coordinate keys & sum totals]
  ▼
[ { "coordinates": [75.78, 26.91], "intensity": 500.00, "orderCount": 2 } ]
  │
  ├── [Final JSON Response serialization]
  ▼
{
  "success": true,
  "points": [ { "coordinates": [75.78, 26.91], "intensity": 500.00, "orderCount": 2 } ]
}
```

### Memory Evolution Analysis

The trace above shows how heatmap coordinates are aggregated in memory:
*   The query loads delivery coordinates and transaction totals from Order documents.
*   The pipeline groups coordinates, calculating total sales values for each location.
*   The coordinates are formatted as a JSON array of heat points.
*   Finally, the points are returned to the client to render the map visualization.

---

## 6. Engineering & Code Quality Review

*   **Aggregation Latency**: Aggregating raw order coordinates on every API call scales poorly, becoming a bottleneck as order volume grows.
    *   *Improvement*: Periodically aggregate and cache heatmap coordinates in Redis or a dedicated summary collection.
