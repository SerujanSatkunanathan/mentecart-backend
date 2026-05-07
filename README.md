# MenteCart Backend

**Service-booking platform backend** — Node.js · Express · TypeScript · MongoDB (Mongoose) · JWT

Built for the GlobalTNA Technical Assessment (Full Stack Flutter Developer).

---

## Tech Stack

| Component       | Technology                                                  |
| --------------- | ----------------------------------------------------------- |
| Runtime         | Node.js 18+ LTS                                            |
| Framework       | Express 5.x                                                |
| Language        | TypeScript (strict mode)                                    |
| Database        | MongoDB 6+ via Mongoose 8                                  |
| Auth            | JWT (jsonwebtoken) + bcrypt                                 |
| Validation      | Zod                                                        |
| Logging         | Pino (structured JSON, request-id correlation)              |
| Testing         | Jest + Supertest + MongoDB Memory Server                    |
| Security        | Helmet, CORS, express-rate-limit                            |

## Architecture

Strict 4-layer architecture with downward-only dependencies:

```
Controllers → Services → Repositories → Models
```

- **Controllers** — HTTP parsing only, zero business logic
- **Services** — Business rules, transactions, orchestration
- **Repositories** — Database access, returns plain JS objects
- **Models** — Mongoose schemas and TypeScript interfaces

## Prerequisites

- Node.js 18+ LTS
- MongoDB 6+ (or MongoDB Memory Server for tests)
- npm 9+

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd mentecart-backend

# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env

# Start development server (hot-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Environment Variables

| Variable                | Default                 | Description                     |
| ----------------------- | ----------------------- | ------------------------------- |
| `PORT`                  | `5000`                  | HTTP server port                |
| `NODE_ENV`              | `development`           | development \| production \| test |
| `MONGODB_URI`           | —                       | MongoDB connection string       |
| `JWT_SECRET`            | —                       | HS256 signing secret (≥16 chars)|
| `JWT_EXPIRY`            | `12h`                   | Access token TTL                |
| `SLOT_TTL_MINUTES`      | `15`                    | Cart item hold duration         |
| `MAX_BOOKINGS_PER_DAY`  | `3`                     | Per-user daily booking cap      |
| `PAYHERE_MERCHANT_ID`   | —                       | PayHere sandbox merchant ID     |
| `PAYHERE_MERCHANT_SECRET`| —                      | PayHere sandbox signing secret  |
| `CORS_ORIGIN`           | `*`                     | Allowed CORS origin             |

## API Endpoints

Base URL: `/api/v1`

### Auth
| Method | Endpoint           | Auth     | Description           |
| ------ | ------------------ | -------- | --------------------- |
| POST   | `/auth/signup`     | Public   | Register new user     |
| POST   | `/auth/login`      | Public   | Login, receive JWT    |
| GET    | `/auth/me`         | Bearer   | Get current user      |

### Services
| Method | Endpoint           | Auth     | Description                       |
| ------ | ------------------ | -------- | --------------------------------- |
| GET    | `/services`        | Public   | List services (paginated)         |
| GET    | `/services/:id`    | Public   | Service detail + available slots  |

### Cart
| Method | Endpoint               | Auth   | Description        |
| ------ | ---------------------- | ------ | ------------------ |
| GET    | `/cart`                | Bearer | Get current cart   |
| POST   | `/cart/items`          | Bearer | Add item to cart   |
| PATCH  | `/cart/items/:itemId`  | Bearer | Update cart item   |
| DELETE | `/cart/items/:itemId`  | Bearer | Remove from cart   |

### Bookings
| Method | Endpoint                 | Auth   | Description           |
| ------ | ------------------------ | ------ | --------------------- |
| POST   | `/bookings/checkout`     | Bearer | Convert cart → booking|
| GET    | `/bookings`              | Bearer | List user bookings    |
| GET    | `/bookings/:id`          | Bearer | Booking detail        |
| POST   | `/bookings/:id/cancel`   | Bearer | Cancel booking        |

### Webhooks
| Method | Endpoint                      | Auth      | Description          |
| ------ | ----------------------------- | --------- | -------------------- |
| POST   | `/bookings/webhooks/payhere`  | Signature | PayHere callback     |

## Key Business Rules

1. **Overbooking Prevention** — Capacity decrement uses atomic `findOneAndUpdate` with `$lt` guard
2. **Status Machine** — Booking transitions validated against a static transitions map
3. **Transactional Checkout** — Entire checkout runs inside a Mongoose session
4. **Audit Trail** — Every status transition logged to BookingAudit collection
5. **Rate Limiting** — Auth routes limited to 20 requests per 15 minutes per IP

## Testing

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
```

Tests use MongoDB Memory Server — no external database needed.

## Known Limitations

- Refresh tokens not implemented (re-login required after JWT expiry)
- Slot seeding requires direct DB access or admin API (out of scope)
- Email notifications are not implemented
- Real-time slot availability needs WebSocket/SSE (out of scope)
- PayHere integration is sandbox-only

## Project Structure

```
src/
├── config/         # DB connection, env parsing, constants
├── models/         # Mongoose schemas (User, Service, Slot, Cart, Booking, BookingAudit)
├── repositories/   # Database access layer (returns plain objects)
├── services/       # Business logic layer
├── controllers/    # HTTP layer (validation + response)
├── middleware/     # Auth, error handler, request logger
├── validators/     # Zod schemas for request validation
├── routes/         # Express route definitions
├── types/          # Shared TypeScript interfaces
└── app.ts          # Express app factory
server.ts           # Entry point
tests/              # Integration tests (Jest + Supertest)
```

## License

ISC
