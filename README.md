# Nitro Auth — Full-Stack Authentication Backend

A production-grade authentication system built from scratch on **Nitro**, **Drizzle ORM**, and **SQLite**. This project demonstrates deep understanding of authentication primitives — password hashing, JWT stateless sessions, middleware-based route protection, and input validation — without relying on off-the-shelf auth libraries.

> **Why from scratch?** Building auth manually forces you to understand every attack surface: timing attacks on comparison, secret rotation, token expiry, middleware interception, and schema design. This project is a deliberate exercise in that depth.

---

## What This Demonstrates

| Area | Skill Shown |
|------|-------------|
| **Password Security** | Bcrypt hashing with salt rounds, never storing plaintext |
| **Session Management** | JWT signed tokens with expiry, no server-side session store required |
| **Middleware Architecture** | Auto-detected Nitro middleware that guards routes by verifying `Authorization: Bearer <token>` |
| **Database Design** | SQLite schema with unique constraints, auto-increment IDs, and Drizzle ORM for type-safe queries |
| **Input Validation** | Regex email validation, minimum password length, required field checks |
| **Error Handling** | Distinct HTTP status codes (400, 401, 409, 500) with meaningful messages |
| **Dev/Prod Parity** | `JWT_SECRET` env override for production; sensible dev fallback |

---

## Architecture

```
project/
├── config/
│   └── auth.ts              # Shared JWT secret & public route whitelist
├── db/
│   ├── db.ts                # better-sqlite3 connection + table auto-creation
│   ├── schema.ts            # Drizzle ORM schema (users table)
│   └── index.ts             # Seed script for local testing
├── middleware/
│   └── auth.ts              # JWT verification middleware (auto-detected by Nitro)
├── routes/
│   └── api/
│       ├── auth/
│       │   ├── signup.ts    # Create account + issue token
│       │   └── signin.ts    # Authenticate + issue token
│       └── example/
│           └── index.ts     # Protected route (requires valid JWT)
├── public/
│   └── slides.html          # Interactive slide deck explaining the system
└── nitro.config.ts          # Server config with auto-discovery enabled
```

### Request Flow

```
Client
  → POST /api/auth/signup
      → Validate input (email regex, password length)
      → Check duplicate (SQLite UNIQUE constraint)
      → Hash password (bcrypt, 10 rounds)
      → Insert user (Drizzle ORM)
      → Sign JWT (24h expiry)
      → Return { user, token }

Client
  → POST /api/auth/signin
      → Lookup user by email
      → Compare hash (bcrypt.compare — timing-safe)
      → Sign JWT
      → Return { user, token }

Client
  → GET /api/example
      → Middleware intercepts request
      → Skip if route is in PUBLIC_ROUTES
      → Verify Authorization header
      → Verify JWT signature + expiry
      → Attach user to event.context.auth
      → Route handler executes
```

---

## API Reference

### `POST /api/auth/signup`

Create a new user account.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Validation Rules**
- `email` is required and must match `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- `password` is required and must be ≥ 8 characters

**Responses**

| Status | Meaning | Body |
|--------|---------|------|
| `201` | Created | `{ "message": "User created successfully", "user": { "id": 1, "email": "..." }, "token": "eyJ..." }` |
| `400` | Bad Request | Missing fields, invalid email, or short password |
| `409` | Conflict | Email already registered |
| `500` | Server Error | Unexpected DB or crypto failure |

---

### `POST /api/auth/signin`

Authenticate an existing user.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Responses**

| Status | Meaning | Body |
|--------|---------|------|
| `200` | OK | `{ "message": "Sign in successful", "user": { "id": 1, "email": "..." }, "token": "eyJ..." }` |
| `400` | Bad Request | Missing email or password |
| `401` | Unauthorized | Invalid email or password (opaque error to prevent user enumeration) |
| `500` | Server Error | Unexpected failure |

---

### Protected Routes

Any route outside `/api/auth/signin` and `/api/auth/signup` requires a valid JWT.

**Header**
```
Authorization: Bearer <token>
```

**Responses**

| Status | Meaning |
|--------|---------|
| `200` | OK — token valid, request proceeds |
| `401` | Unauthorized — missing, malformed, or expired token |

---

## Database Schema

```sql
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- **`email`** — enforced unique at both the SQLite constraint level and application check
- **`password`** — stores the bcrypt hash, never plaintext
- **`created_at`** — automatic timestamp on insert
- Table is auto-created on first server start — no manual migration needed for local dev

---

## Security Considerations

| Decision | Rationale |
|----------|-----------|
| **Bcrypt over Argon2** | Bcrypt is battle-tested, widely supported, and sufficient for this threat model. Argon2 is easy to swap in if needed. |
| **Opaque 401 errors** | Both "user not found" and "wrong password" return `401 Invalid credentials` to prevent email enumeration attacks. |
| **JWT in response body** | Returned as JSON for flexibility. In production, you may want to move this to an `HttpOnly` cookie to mitigate XSS. |
| **No refresh tokens** | Tokens expire in 24h. Refresh token rotation is left as an extension — this codebase keeps the core simple. |
| **SQLite for local** | Zero-config, file-based persistence. Easy to swap for PostgreSQL/MySQL by changing the Drizzle driver. |
| **Middleware auto-discovery** | No manual route registration — Nitro picks up `middleware/auth.ts` automatically, reducing human error. |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js

### Install

```bash
bun install
```

### Run Development Server

```bash
bun run dev
```

Server starts at `http://localhost:3000`.

### Interactive Slide Deck

Open `http://localhost:3000/slides.html` for a visual walkthrough of the architecture, API, and usage examples.

---

## Usage Examples

### 1. Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"mySecurePass123"}'
```

### 2. Sign In

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"mySecurePass123"}'
```

### 3. Access a Protected Route

```bash
# Replace with the token returned from signin
export TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl http://localhost:3000/api/example \
  -H "Authorization: Bearer $TOKEN"
```

---

## Production Checklist

- [ ] Set a strong, random `JWT_SECRET` environment variable
- [ ] Move JWT delivery to `HttpOnly`, `Secure`, `SameSite=Strict` cookies
- [ ] Add rate limiting on `/api/auth/*` endpoints
- [ ] Implement refresh token rotation
- [ ] Swap SQLite for PostgreSQL/MySQL if you need concurrent writes
- [ ] Add CORS configuration for your frontend domain
- [ ] Enable HTTPS termination

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Runtime / Framework | [Nitro](https://nitro.unjs.io/) — universal server engine |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) — type-safe SQL |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — synchronous, fast SQLite |
| Password Hashing | [bcrypt](https://www.npmjs.com/package/bcrypt) |
| Tokens | [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) |
| Lint / Format | [Biome](https://biomejs.dev/) |

---

## License

MIT — use it, learn from it, break it, improve it.

> *"If you can't build auth from scratch, you don't understand auth."* — This project exists to prove that understanding.
