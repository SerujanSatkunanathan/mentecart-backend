# MenteCart Backend API Documentation

Base URL: `http://localhost:5000/api/v1`

Health check: `GET http://localhost:5000/health`

All request and response bodies are JSON unless stated otherwise. Protected endpoints require:

```http
Authorization: Bearer <jwt>
```

## Response Conventions

Successful pagination responses use:

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "hasMore": false
}
```

Errors use:

```json
{
  "statusCode": 400,
  "message": "Validation failed.",
  "errorCode": "VALIDATION_ERROR"
}
```

Common status codes: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

## Auth

### POST `/auth/signup`

Creates a customer account and returns a JWT.

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response `201`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "66f000000000000000000001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "createdAt": "2026-05-06T03:30:00.000Z"
  }
}
```

Errors: `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`, `429 RATE_LIMIT`.

### POST `/auth/login`

Authenticates an existing user and returns a JWT.

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "66f000000000000000000001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`, `429 RATE_LIMIT`.

### GET `/auth/me`

Returns the authenticated user's profile.

Response `200`:

```json
{
  "user": {
    "id": "66f000000000000000000001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

Errors: `401 NO_TOKEN`, `401 INVALID_TOKEN`, `404 USER_NOT_FOUND`, `429 RATE_LIMIT`.

## Services

### GET `/services`

Lists active services with pagination, optional category filter, and title search.

Query parameters:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Page size |
| `category` | string | none | Exact category filter |
| `search` | string | none | Mongo text search over service title |

Example:

```http
GET /api/v1/services?page=1&limit=20&category=cleaning&search=home
```

Response `200`:

```json
{
  "data": [
    {
      "_id": "66f000000000000000000010",
      "title": "Home Cleaning",
      "description": "Professional home cleaning",
      "price": 5000,
      "duration": 60,
      "category": "cleaning",
      "imageUrl": "https://example.com/cleaning.jpg",
      "capacityPerSlot": 3,
      "isActive": true
    }
  ],
  "total": 1,
  "page": 1,
  "hasMore": false
}
```

### GET `/services/:id`

Returns service detail plus available slots for the next 30 days.

Response `200`:

```json
{
  "service": {
    "_id": "66f000000000000000000010",
    "title": "Home Cleaning",
    "description": "Professional home cleaning",
    "price": 5000,
    "duration": 60,
    "category": "cleaning",
    "imageUrl": "https://example.com/cleaning.jpg",
    "capacityPerSlot": 3,
    "isActive": true
  },
  "slots": [
    {
      "_id": "66f000000000000000000020",
      "serviceId": "66f000000000000000000010",
      "date": "2026-05-07T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "10:00",
      "capacity": 3,
      "booked": 0,
      "isAvailable": true
    }
  ]
}
```

Errors: `400 INVALID_ID`, `404 SERVICE_NOT_FOUND`.

## Cart

All cart endpoints are protected. A cart belongs to exactly one authenticated user.

### GET `/cart`

Returns the current user's enriched cart with totals.

Response `200`:

```json
{
  "items": [
    {
      "_id": "66f000000000000000000030",
      "serviceId": "66f000000000000000000010",
      "slotId": "66f000000000000000000020",
      "price": 5000,
      "expiresAt": "2026-05-06T03:45:00.000Z",
      "service": {
        "title": "Home Cleaning",
        "imageUrl": "https://example.com/cleaning.jpg",
        "duration": 60
      },
      "slot": {
        "date": "2026-05-07T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "10:00"
      }
    }
  ],
  "itemCount": 1,
  "totalAmount": 5000
}
```

### POST `/cart/items`

Adds a service and selected slot to the cart. Duplicate service/slot pairs are rejected.

Request:

```json
{
  "serviceId": "66f000000000000000000010",
  "slotId": "66f000000000000000000020"
}
```

Response `201`:

```json
{
  "cart": {
    "items": [
      {
        "_id": "66f000000000000000000030",
        "serviceId": "66f000000000000000000010",
        "slotId": "66f000000000000000000020",
        "price": 5000,
        "expiresAt": "2026-05-06T03:45:00.000Z"
      }
    ],
    "itemCount": 1,
    "totalAmount": 5000
  }
}
```

Errors: `400 SERVICE_NOT_FOUND`, `400 SLOT_NOT_FOUND`, `400 SLOT_MISMATCH`, `400 SLOT_EXPIRED`, `409 DUPLICATE_ITEM`, `409 SLOT_FULL`.

### PATCH `/cart/items/:itemId`

Updates a cart item's selected slot.

Request:

```json
{
  "slotId": "66f000000000000000000021"
}
```

Response `200`:

```json
{
  "cart": {
    "items": [
      {
        "_id": "66f000000000000000000030",
        "serviceId": "66f000000000000000000010",
        "slotId": "66f000000000000000000021",
        "price": 5000,
        "expiresAt": "2026-05-06T03:45:00.000Z"
      }
    ],
    "itemCount": 1,
    "totalAmount": 5000
  }
}
```

Errors: `400 SLOT_NOT_FOUND`, `409 SLOT_FULL`, `404 ITEM_NOT_FOUND`.

### DELETE `/cart/items/:itemId`

Removes an item from the cart.

Response `200`:

```json
{
  "cart": {
    "items": [],
    "itemCount": 0,
    "totalAmount": 0
  }
}
```

Errors: `404 ITEM_NOT_FOUND`, `404 CART_NOT_FOUND`.

## Bookings

Booking statuses: `pending`, `confirmed`, `completed`, `cancelled`, `failed`.

Payment methods: `payhere`, `cash`, `pay_on_arrival`.

Payment statuses: `unpaid`, `paid`, `failed`, `refunded`.

Business behavior:

- Checkout runs in a MongoDB transaction.
- Slot capacity is incremented atomically during checkout.
- Cash and pay-on-arrival bookings are created as `confirmed` with `paymentStatus: "unpaid"`.
- PayHere bookings are created as `pending` and confirmed by webhook success.
- Cancellation releases slot capacity when allowed by cutoff.
- Status changes are written to booking `statusHistory` and the booking audit collection.

### POST `/bookings/checkout`

Converts the authenticated user's cart into one booking.

Request:

```json
{
  "paymentMethod": "cash"
}
```

Response `201` for cash/pay-on-arrival:

```json
{
  "booking": {
    "_id": "66f000000000000000000040",
    "userId": "66f000000000000000000001",
    "items": [
      {
        "serviceId": "66f000000000000000000010",
        "slotId": "66f000000000000000000020",
        "price": 5000
      }
    ],
    "totalAmount": 5000,
    "status": "confirmed",
    "paymentMethod": "cash",
    "paymentStatus": "unpaid",
    "paymentRef": null,
    "cancelCutoff": "2026-05-06T09:00:00.000Z",
    "statusHistory": [
      {
        "status": "confirmed",
        "at": "2026-05-06T03:30:00.000Z",
        "by": "66f000000000000000000001"
      }
    ]
  }
}
```

Response `201` for PayHere:

```json
{
  "booking": {
    "_id": "66f000000000000000000041",
    "status": "pending",
    "paymentMethod": "payhere",
    "paymentStatus": "unpaid",
    "paymentRef": "MC-1778038015382-000001"
  },
  "paymentUrl": "https://sandbox.payhere.lk/pay/checkout?merchant_id=..."
}
```

Errors: `400 VALIDATION_ERROR`, `409 SLOT_FULL`, `422 EMPTY_CART`, `422 DAILY_LIMIT_REACHED`.

### GET `/bookings`

Lists the authenticated user's bookings.

Query parameters:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Page size |

Response `200`:

```json
{
  "data": [
    {
      "_id": "66f000000000000000000040",
      "totalAmount": 5000,
      "status": "confirmed",
      "paymentMethod": "cash",
      "paymentStatus": "unpaid"
    }
  ],
  "total": 1,
  "page": 1,
  "hasMore": false
}
```

### GET `/bookings/:id`

Returns a booking owned by the authenticated user.

Response `200`:

```json
{
  "booking": {
    "_id": "66f000000000000000000040",
    "items": [],
    "totalAmount": 5000,
    "status": "confirmed",
    "paymentMethod": "cash",
    "paymentStatus": "unpaid",
    "statusHistory": [
      {
        "status": "confirmed",
        "at": "2026-05-06T03:30:00.000Z",
        "by": "66f000000000000000000001"
      }
    ]
  }
}
```

Errors: `403 FORBIDDEN`, `404 BOOKING_NOT_FOUND`.

### POST `/bookings/:id/cancel`

Cancels a non-terminal booking before `cancelCutoff` and releases slot capacity.

Response `200`:

```json
{
  "booking": {
    "_id": "66f000000000000000000040",
    "status": "cancelled",
    "paymentStatus": "unpaid"
  }
}
```

Errors: `400 INVALID_TRANSITION`, `400 PAST_CUTOFF`, `403 FORBIDDEN`, `404 BOOKING_NOT_FOUND`.

## Webhooks

### POST `/bookings/webhooks/payhere`

PayHere callback endpoint. This endpoint expects a raw `application/x-www-form-urlencoded` body and validates `md5sig`.

Request fields:

| Name | Description |
| --- | --- |
| `merchant_id` | PayHere merchant ID |
| `order_id` | Booking `paymentRef` |
| `payhere_amount` | Amount sent by PayHere |
| `payhere_currency` | Currency, normally `LKR` |
| `status_code` | `2` means success; other values are treated as failure |
| `md5sig` | PayHere signature |

Response `200`:

```json
{
  "received": true
}
```

Errors: `400 INVALID_SIGNATURE`, `404 BOOKING_NOT_FOUND`.

## Current Verification Status

Verified locally:

- `npm.cmd run build` passes.
- `npm.cmd test` passes with MongoDB Memory Server when process spawning is allowed: 3 suites, 26 tests.

Known documentation/coverage gaps:

- Service endpoints are implemented but not covered by tests.
- Cart item update is implemented for slot changes only; there is no quantity field in the data model.
- The cart stores `expiresAt`, but slot capacity is only reserved during checkout, not at add-to-cart time.
- PayHere webhook is implemented but not covered by tests.
- `npm.cmd run lint` currently fails because ESLint v9 expects an `eslint.config.js` file and the project does not include one.
