# POS Cashier API Requirements

This document outlines the REST API endpoints required for the React POS Cashier application to sync with the Laravel backend. Since this frontend operates with an **offline-first architecture** (using IndexedDB to cache data and queue actions), the APIs should focus on initial data fetching and robust sync handling.

All endpoints should be prefixed with `/api/v1` and expect `Accept: application/json` and standard Bearer token authentication (e.g., Laravel Sanctum or Passport).

---

## 1. Authentication & Cashiers
Used for login and identifying who is operating the POS.

### `POST /api/v1/auth/login`
Authenticates a cashier via a PIN code.
- **Payload:**
  ```json
  {
    "pin": "string"
  }
  ```
- **Response:**
  ```json
  {
    "status": true,
    "message": "Login successful",
    "data": {
      "token": "bearer-token...",
      "cashier": {
        "id": "uuid",
        "name": "Cashier Name",
        "role": "cashier|manager"
      }
    }
  }
  ```

---

## 2. Product Catalog
Used to pull down the catalog into the local IndexedDB.

### `GET /api/v1/products`
Retrieves all active products. Should support pagination or a `last_synced_at` timestamp for delta updates.
- **Query Params:** `?updated_after=YYYY-MM-DDTHH:MM:SSZ` (optional)
- **Response:**
  ```json
  {
    "status": true,
    "message": "Products retrieved",
    "data": [
      {
        "id": "uuid",
        "name": "Product Name (EN)",
        "nameAr": "Product Name (AR)",
        "barcode": "1234567890",
        "sku": "SKU-123",
        "price": 10.50,
        "category": "Snacks",
        "stock": 100,
        "unit": "pcs",
        "taxRate": 15.0,
        "isActive": true,
        "updatedAt": "2024-04-19T10:00:00Z"
      }
    ]
  }
  ```

---

## 3. Cashier Sessions (الورديات)
Used to track opening and closing of cash drawers.

### `POST /api/v1/sessions/open`
Opens a new session.
- **Payload:**
  ```json
  {
    "openingBalance": 100.00
  }
  ```
- **Response:** Returns the created session object with `status: "open"`.

### `POST /api/v1/sessions/close`
Closes the currently open session.
- **Payload:**
  ```json
  {
    "sessionId": "uuid",
    "actualBalance": 250.00,
    "expectedBalance": 200.00,
    "difference": 50.00,
    "totalSales": 100.00,
    "totalRefunds": 0.00
  }
  ```

### `GET /api/v1/sessions`
Fetches past sessions for the "Balances History" modal. Should support pagination.

---

## 4. Orders & Syncing (الطلبات)
Because the POS can work offline, orders are added to a local sync queue and pushed to the backend when the connection is restored.

### `POST /api/v1/sync`
A bulk endpoint to process queued actions (`create_order`, `refund_order`, etc.). The frontend will send an array of sync items.
- **Payload:**
  ```json
  {
    "items": [
      {
        "id": "sync-uuid-1",
        "action": "create_order",
        "payload": {
           "id": "order-uuid-1",
           "orderNumber": "INV-1001",
           "subtotal": 100.00,
           "taxTotal": 15.00,
           "discountTotal": 0.00,
           "grandTotal": 115.00,
           "cashReceived": 120.00,
           "changeGiven": 5.00,
           "status": "completed",
           "payments": [
             { "method": "cash", "amount": 115.00 }
           ],
           "items": [
             {
               "product_id": "prod-uuid",
               "quantity": 2,
               "discount": 0,
               "lineTotal": 100.00,
               "lineTax": 15.00
             }
           ]
        },
        "createdAt": "2024-04-19T10:00:00Z"
      },
      {
        "id": "sync-uuid-2",
        "action": "refund_order",
        "payload": {
           "orderId": "order-uuid-1",
           "refundItems": null // null implies full refund, or an array of product IDs for partial
        },
        "createdAt": "2024-04-19T10:15:00Z"
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "status": true,
    "message": "Sync completed",
    "data": {
      "successful": ["sync-uuid-1", "sync-uuid-2"],
      "failed": []
    }
  }
  ```
> **Backend Tip:** When processing `create_order`, Laravel should deduct stock quantities in the database. When processing `refund_order`, Laravel should restore stock quantities.

---

## 5. Orders History (Read-Only)
For the Order History Modal.

### `GET /api/v1/orders`
Fetches a list of orders (paginated). The frontend fetches these to show past transactions not just in the local queue.
- **Query Params:** `?date=YYYY-MM-DD` or `?session_id=...`

---

## 6. Settings
General configuration for the POS.

### `GET /api/v1/settings`
- **Response:**
  ```json
  {
    "status": true,
    "data": {
      "storeName": "QuickMart",
      "taxEnabled": true,
      "defaultTaxRate": 15.0,
      "currency": "EGP",
      "receiptFooter": "Thank you for visiting us!"
    }
  }
  ```

---

## Laravel Implementation Recommendations

1. **Transactions:** Since the `/api/v1/sync` endpoint handles multiple operations at once (creating an order, decrementing stock, associating items), wrap the iteration in a DB Transaction (`DB::transaction(function() { ... })`).
2. **Idempotency:** The POS might send the same `SyncQueueItem` ID multiple times if the network drops during the response. Ensure that creating an order uses `firstOrCreate` on the provided `id` (since the frontend generates UUIDs) to prevent duplicate orders.
3. **Queue System:** If the sync payload is huge, you can dispatch Laravel Jobs for processing background queue items, though real-time response is preferred to clear the local IndexedDB.
