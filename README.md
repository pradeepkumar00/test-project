# BigFun Platform

BigFun is a full-stack gaming platform (similar to [bigfun.in](https://bigfun.in)) with user-facing gameplay, wallet management, referrals, and an admin portal for operations.

This repository is a **monorepo** containing the backend APIs and both Angular frontends.

---

## Monorepo Structure

```
.
├── Backend/                    # Node.js API (user + admin routes)
│   ├── config/                 # App config (default, local, env mapping)
│   ├── controllers/
│   │   └── admin/              # Admin-only controllers
│   ├── models/
│   ├── routes/
│   │   └── admin/              # Admin routes (mounted at /api/admin)
│   ├── services/
│   ├── scripts/seed.js         # Demo data seeder
│   └── index.js                # API entry (port 5000)
├── frontend/
│   ├── bigfun-frontend/        # User Angular app (port 5200)
│   └── bigfun-admin/           # Admin Angular portal (port 5201)
├── package.json                # Root workspace scripts
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| User API | Node.js, Express 5, MongoDB, Redis, JWT |
| Admin API | Same server at `/api/admin` with separate admin JWT guard |
| User UI | Angular 19 (standalone components) |
| Admin UI | Angular 19 |
| Config | `config` package + `Backend/config/local.json` |

---

## Prerequisites

- **Node.js** 20+
- **MongoDB** running on `127.0.0.1:27017`
- **Redis** running on `127.0.0.1:6379` (with password if required)

---

## Quick Start

### 1. Install dependencies (from repo root)

```bash
npm install
```

This installs all workspace packages: backend, user frontend, and admin portal.

### 2. Configure backend secrets

```bash
cp Backend/config/local.example.json Backend/config/local.json
```

Edit `Backend/config/local.json` with your JWT secrets and Redis password:

```json
{
  "jwt": { "secret": "your-dev-secret" },
  "adminJwt": { "secret": "your-admin-dev-secret" },
  "redis": {
    "url": "redis://127.0.0.1:6379",
    "password": "password"
  }
}
```

### 3. Seed demo data

```bash
npm run seed
```

### 4. Start all services

**Option A — one command (recommended for local dev):**

```bash
npm run dev:all
```

**Option B — separate terminals:**

```bash
npm run dev:api          # API (user + admin) → http://localhost:5000
npm run start:frontend   # User app → http://localhost:5200
npm run start:admin      # Admin portal → http://localhost:5201
```

---

## Services & Ports

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:5000/api | User routes: auth, wallet, battles, games |
| Admin API | http://localhost:5000/api/admin | Deposits, withdrawals, users, KYC |
| User App | http://localhost:5200 | Player-facing mobile UI |
| Admin Portal | http://localhost:5201 | Operations dashboard |

Health checks:
- API: `GET http://localhost:5000/api/health`
- Admin API: `GET http://localhost:5000/api/admin/health`

---

## Local dev credentials (after `npm run seed`)

> **Do not use these in production.** Change passwords and onboard real admins with `npm run onboard:superadmin`. Never display admin credentials in the UI.

| Role | Mobile | Password |
|------|--------|----------|
| Demo player | `9876543210` | `demo123` |
| Second player | `9123456781` | `demo123` |

`npm run seed` also creates a default superadmin — use `onboard:superadmin` to set your own admin account instead.

---

## Root NPM Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run dev:all` | Start API and both frontends |
| `npm run dev:api` | API with file watch (user + admin routes) |
| `npm run start:frontend` | User Angular dev server |
| `npm run start:admin` | Admin Angular dev server |
| `npm run seed` | Seed MongoDB with demo data |
| `npm run onboard:superadmin` | Create or promote a superadmin account |
| `npm run build` | Production build for both frontends |

---

## Features

### User App (`frontend/bigfun-frontend`)

- OTP-based registration & login with referral codes
- Ludo battles — create, join, open/running lists
- Color prediction games (Win Go 1/3/5 min)
- Wallet — UPI deposit (UTR submit), withdraw, transaction history
- Profile, KYC submission, refer & earn, support

### Admin Portal (`frontend/bigfun-admin`)

- Dashboard with platform stats
- Approve/reject deposits and withdrawals
- Manage battles (cancel, force-complete, delete)
- User management (activate/deactivate, balance adjust for superadmin)
- KYC review
- Transaction log

### Backend (`Backend/`)

- JWT auth for users and admins (separate secrets)
- Redis-backed OTP with `bigfun:` key prefix
- SMS OTP via Twilio (configurable; console fallback for local dev)
- Wallet with admin approval flow for deposits
- Battle engine with platform fee (2.5%)
- Color game scheduler via cron

---

## Configuration

The backend uses the [`config`](https://github.com/node-config/node-config) package with **two JSON layers**:

| File | Committed | Purpose |
|------|-----------|---------|
| `default.json` | Yes | Shipped defaults — do not put secrets here |
| `local.json` | **No (gitignored)** | **Single override file** — overrides anything from `default.json` |
| `local.example.json` | Yes | Full template — copy this to create `local.json` |
| `custom-environment-variables.json` | Yes | Production env var mapping (when not using `local.json`) |

### Setup (one file for all local overrides)

```bash
cp Backend/config/local.example.json Backend/config/local.json
```

Edit `Backend/config/local.json` to change **any** setting — ports, OTP expiry, Redis, JWT, Twilio, wallet, battles, etc. You only need to change the keys you care about; unset keys fall back to `default.json`.

**Examples in `local.json`:**

```json
{
  "otp": { "expiryMinutes": 10 },
  "port": 5000,
  "jwt": { "secret": "your-secret" },
  "adminJwt": { "secret": "your-admin-secret" }
}
```

### Config files summary

```
Backend/config/
├── default.json                      ← base defaults (committed)
├── local.json                        ← YOUR overrides (gitignored, copy from example)
├── local.example.json                ← full template with every key
└── custom-environment-variables.json ← env vars for production deploys
```

### SMS / Twilio (OTP)

OTP delivery is handled by `Backend/services/smsService.js`. The provider is config-driven:

| `sms.provider` | Behavior |
|----------------|----------|
| `console` | Logs OTP to server console (default for local dev) |
| `twilio` | Sends OTP via Twilio SMS API |

**Enable Twilio in `Backend/config/local.json`:**

```json
{
  "sms": {
    "provider": "twilio",
    "twilio": {
      "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "authToken": "your-twilio-auth-token",
      "from": "+1234567890",
      "countryCode": "+91"
    }
  }
}
```

Or set environment variables (see `.env.example`):

```bash
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM=+1234567890
TWILIO_COUNTRY_CODE=+91
```

**OTP message template** (optional, in `default.json` or override in local config):

```
Your {appName} OTP for {purpose} is {otp}. Valid for {expiryMinutes} minutes. Do not share this code.
```

Placeholders: `{appName}`, `{otp}`, `{purpose}`, `{expiryMinutes}`

### Request logging

HTTP requests are logged via `middleware/requestLogger.js` with IP, method, path, status, duration, user/admin identity, query, and body (sensitive fields redacted).

Configure in `Backend/config/local.json`:

```json
{
  "logging": {
    "level": "info",
    "format": "pretty",
    "logRequestBody": true,
    "logQuery": true,
    "logHeaders": false,
    "skipPaths": ["/api/health", "/api/admin/health"]
  }
}
```

Production env vars: `LOG_LEVEL`, `LOG_FORMAT=json`, `LOG_HEADERS=true`

---

## API Overview

### User API (`/api`)

| Area | Endpoints |
|------|-----------|
| Auth | `/auth/send-otp`, `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/profile` |
| Wallet | `/wallet/balance`, `/wallet/deposit`, `/wallet/withdraw`, `/wallet/transactions` |
| Battles | `/battles/create`, `/battles/join`, `/battles/open`, `/battles/running` |
| Games | `/games/*` (color prediction) |
| Home | `/home` |

### Admin API (`/api/admin`)

| Area | Endpoints |
|------|-----------|
| Auth | `/api/admin/auth/login`, `/api/admin/auth/logout`, `/api/admin/auth/profile` |
| Dashboard | `/api/admin/dashboard` |
| Deposits | `/api/admin/deposits`, `/api/admin/deposits/:id/approve`, `/api/admin/deposits/:id/reject` |
| Withdrawals | `/api/admin/withdrawals`, `/api/admin/withdrawals/:id/approve`, `/api/admin/withdrawals/:id/reject` |
| Battles | `/api/admin/battles`, `/api/admin/battles/:id/cancel`, `/api/admin/battles/:id/complete` |
| Users | `/api/admin/users`, `/api/admin/users/:id/status`, `/api/admin/users/:id/balance` (superadmin) |
| KYC | `/api/admin/kyc/pending`, `/api/admin/kyc/:userId/approve`, `/api/admin/kyc/:userId/reject` |
| Transactions | `/api/admin/transactions` |

---

## Development Notes

- User frontend proxies `/api` → `http://localhost:5000` (`frontend/bigfun-frontend/proxy.conf.json`)
- Admin portal proxies `/api` → `http://localhost:5000`; admin app calls `/api/admin/*` (`frontend/bigfun-admin/proxy.conf.json`)
- VS Code: use **Run All (BigFun)** task from `.vscode/tasks.json`
- Each package can also be run independently from its own folder

---

## Production Build

```bash
npm run build
```

Outputs:
- `frontend/bigfun-frontend/dist/bigfun-frontend`
- `frontend/bigfun-admin/dist/bigfun-admin`

Update production API URLs in:
- `frontend/bigfun-frontend/src/environments/environment.prod.ts`
- `frontend/bigfun-admin/src/environments/environment.prod.ts`

Deploy the Backend with `NODE_ENV=production` and environment variables set.

---

## Package READMEs

- [User frontend](frontend/bigfun-frontend/README.md)
- [Admin portal](frontend/bigfun-admin/README.md)

---

## License

ISC
