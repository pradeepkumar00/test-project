# BigFun Platform

BigFun is a full-stack gaming platform (similar to [bigfun.in](https://bigfun.in)) with user-facing gameplay, wallet management, referrals, and an admin portal for operations.

This repository is a **monorepo** containing the backend APIs and both Angular frontends.

---

## Monorepo Structure

```
.
├── Backend/                    # Node.js API (user + admin server)
│   ├── admin-server/           # Admin REST API (port 5050)
│   ├── config/                 # App config (default, local, env mapping)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/seed.js         # Demo data seeder
│   └── index.js                # User API entry (port 5000)
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
| Admin API | Separate Express app on port 5050 |
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
npm run dev:api          # User API → http://localhost:5000
npm run dev:admin-api    # Admin API → http://localhost:5050
npm run start:frontend   # User app → http://localhost:5200
npm run start:admin      # Admin portal → http://localhost:5201
```

---

## Services & Ports

| Service | URL | Description |
|---------|-----|-------------|
| User API | http://localhost:5000/api | Auth, wallet, battles, games |
| Admin API | http://localhost:5050/api | Deposits, withdrawals, users, KYC |
| User App | http://localhost:5200 | Player-facing mobile UI |
| Admin Portal | http://localhost:5201 | Operations dashboard |

Health checks:
- User API: `GET http://localhost:5000/api/health`
- Admin API: `GET http://localhost:5050/api/health`

---

## Demo Credentials

| Role | Mobile | Password |
|------|--------|----------|
| Demo player | `9876543210` | `demo123` |
| Second player | `9123456781` | `demo123` |
| Super admin | `9999999999` | `admin123` |

Referral code for demo user: `816319`  
Register link: `http://localhost:5200/register?refer=816319`

---

## Root NPM Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run dev:all` | Start API, admin API, both frontends |
| `npm run dev:api` | User API with file watch |
| `npm run dev:admin-api` | Admin API with file watch |
| `npm run start:frontend` | User Angular dev server |
| `npm run start:admin` | Admin Angular dev server |
| `npm run seed` | Seed MongoDB with demo data |
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
- Wallet with admin approval flow for deposits
- Battle engine with platform fee (2.5%)
- Color game scheduler via cron

---

## Configuration

| File | Purpose |
|------|---------|
| `Backend/config/default.json` | Default settings (ports, limits, game types) |
| `Backend/config/local.json` | Local secrets (**gitignored**) |
| `Backend/config/local.example.json` | Template for local config |
| `Backend/config/custom-environment-variables.json` | Env var overrides for production |

Production env vars: `PORT`, `ADMIN_PORT`, `MONGODB_URI`, `REDIS_URL`, `REDIS_PASSWORD`, `JWT_SECRET`, `ADMIN_JWT_SECRET`

---

## API Overview

### User API (`/api`)

| Area | Endpoints |
|------|-----------|
| Auth | `/auth/send-otp`, `/auth/register`, `/auth/login`, `/auth/profile` |
| Wallet | `/wallet/balance`, `/wallet/deposit`, `/wallet/withdraw`, `/wallet/transactions` |
| Battles | `/battles/create`, `/battles/join`, `/battles/open`, `/battles/running` |
| Games | `/games/*` (color prediction) |
| Home | `/home` |

### Admin API (`/api`)

| Area | Endpoints |
|------|-----------|
| Auth | `/auth/login`, `/auth/profile` |
| Dashboard | `/dashboard` |
| Deposits | `/deposits`, `/deposits/:id/approve`, `/deposits/:id/reject` |
| Withdrawals | `/withdrawals`, `/withdrawals/:id/approve`, `/withdrawals/:id/reject` |
| Battles | `/battles`, `/battles/:id/cancel`, `/battles/:id/complete` |
| Users | `/users`, `/users/:id/status`, `/users/:id/balance` (superadmin) |
| KYC | `/kyc/pending`, `/kyc/:userId/approve`, `/kyc/:userId/reject` |
| Transactions | `/transactions` |

---

## Development Notes

- User frontend proxies `/api` → `http://localhost:5000` (`frontend/bigfun-frontend/proxy.conf.json`)
- Admin portal proxies `/api` → `http://localhost:5050` (`frontend/bigfun-admin/proxy.conf.json`)
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
