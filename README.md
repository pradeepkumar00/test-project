# Masti Ludo Platform

Masti Ludo is a full-stack skill-gaming platform with a player app (Ludo battles, wallet, referrals) and an admin portal for operations.

This repository is a **monorepo** containing the backend APIs and both Angular frontends.

---

## Monorepo Structure

```
.
├── Backend/                         # Node.js API (user + admin routes)
│   ├── config/                      # App config (default, local, env mapping)
│   ├── constants/adminPermissions.js
│   ├── controllers/
│   │   └── admin/                   # Admin-only controllers (incl. admins CRUD)
│   ├── models/
│   ├── routes/
│   │   └── admin/                   # Admin routes → /api/admin
│   ├── scripts/
│   │   ├── seed.js                  # Demo data seeder
│   │   └── onboard-superadmin.js    # Create/reset portal superadmin
│   ├── secrets/                     # Local credentials (gitignored)
│   │   └── superadmin.example.json  # Template only
│   ├── services/
│   └── index.js                     # API entry (port 5000)
├── frontend/
│   ├── bigfun-frontend/             # User Angular app (port 5200)
│   └── bigfun-admin/                # Admin Angular portal (port 5201)
├── package.json                     # Root workspace scripts
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| User API | Node.js, Express 5, MongoDB, Redis, JWT |
| Admin API | Same server at `/api/admin` with separate admin JWT + permissions |
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

### 4. Onboard portal superadmin (credentials → secrets file)

```bash
npm run onboard:superadmin -- --mobile 9999999999 --name "Super Admin" --generate --promote
```

This creates/resets the superadmin and writes credentials to:

```
Backend/secrets/superadmin.json   ← gitignored — do not commit
```

Open that file for **mobile + password**, then sign in at the **Superadmin portal** (port 5202).

Regenerate anytime with the same command. Template: `Backend/secrets/superadmin.example.json`.

### 5. Start all services

**Option A — one command (recommended for local dev):**

```bash
npm run dev:all
```

**Option B — separate terminals:**

```bash
npm run dev:api            # API → http://localhost:5000
npm run start:frontend     # User app → http://localhost:5200
npm run start:admin        # Admin portal → http://localhost:5201
npm run start:superadmin   # Superadmin portal → http://localhost:5202
```

---

## Services & Ports

| Service | URL | Description |
|---------|-----|-------------|
| API | http://localhost:5000/api | User routes |
| Admin API | http://localhost:5000/api/admin | Staff admin ops (permission-gated) |
| Superadmin API | http://localhost:5000/api/superadmin | Superadmin-only (admins + settings) |
| User App | http://localhost:5200 | Player UI |
| Admin Portal | http://localhost:5201 | Staff operations |
| Superadmin Portal | http://localhost:5202 | Create admins & assign access |

Health checks:
- API: `GET http://localhost:5000/api/health`
- Admin API: `GET http://localhost:5000/api/admin/health`

---

## Local credentials

> **Do not use seed/demo passwords in production.** Never commit `Backend/secrets/` or put real passwords in git.

### Players (after `npm run seed`)

| Role | Mobile | Password |
|------|--------|----------|
| Demo player | `9876543210` | `demo123` |
| Second player | `9123456781` | `demo123` |

### Admin portal

| Role | How to get credentials |
|------|------------------------|
| **Superadmin** | `npm run onboard:superadmin -- --generate --promote` → `Backend/secrets/superadmin.json` → login at **http://localhost:5202** |
| **Admin** | Created in Superadmin portal → **Admins** page → login at **http://localhost:5201** |

---

## Admin roles & permissions

| Role | Access |
|------|--------|
| **Superadmin** | Full access to every page and action |
| **Admin** | Only permissions assigned by a superadmin |

### Permission areas

| Area | View | Perform |
|------|------|---------|
| Dashboard | `dashboard.view` | — |
| Deposits | `deposits.view` | `deposits.manage` (approve/reject) |
| Withdrawals | `withdrawals.view` | `withdrawals.manage` |
| Battles | `battles.view` | `battles.manage` |
| Users | `users.view` | `users.manage` · `users.balance` |
| KYC | `kyc.view` | `kyc.manage` |
| Transactions | `transactions.view` | — |
| Settings | `settings.view` | `settings.manage` |
| Admins | — | `admins.manage` |

Sidebar, routes, UI buttons, and APIs all enforce these permissions.

**Create a limited admin:** log in at **Superadmin portal** (5202) → **Admins** → **Create Admin** → tick permissions.

---

## Root NPM Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run dev:all` | Start API and both frontends |
| `npm run dev:api` | API with file watch (user + admin routes) |
| `npm run start:frontend` | User Angular dev server |
| `npm run start:admin` | Staff Admin Angular portal (5201) |
| `npm run start:superadmin` | Superadmin Angular portal (5202) |
| `npm run seed` | Seed MongoDB with demo data |
| `npm run onboard:superadmin` | Create/reset superadmin + write `Backend/secrets/superadmin.json` |
| `npm run build` | Production build for both frontends |

### Superadmin onboard examples

```bash
# Generate strong password, reset account, save secrets
npm run onboard:superadmin -- --mobile 9999999999 --generate --promote

# Set an explicit password
npm run onboard:superadmin -- --mobile 9999999999 --password 'YourStrongPass' --promote

# Skip writing the secrets file
npm run onboard:superadmin -- --mobile 9999999999 --password 'x' --promote --no-save-secrets
```

---

## Features

### User App (`frontend/bigfun-frontend`)

- OTP-only login (auto-register with optional referral code)
- Ludo Classic battles — create/join; only platform-fee share comes from referral wallet, rest from deposit wallet
- Battle history (`/history`) with status filters and win/loss
- Wallet — deposit / winning / bonus balances; UPI deposit & withdraw sheets
- Profile — KYC modal, stats (won / lost / played, referral earn, money won/lost)
- Refer & Earn, WhatsApp support (from platform settings)
- Bottom nav: Home · Wallet · Refer · Support · Profile

### Admin Portal (`frontend/bigfun-admin`)

- Dashboard with platform stats
- Approve/reject deposits and withdrawals
- Manage battles (cancel, force-complete, delete)
- User management (status, balance adjust when permitted)
- KYC review, transaction log
- Live **Platform Settings** (UPI, fees, WhatsApp, payment methods)
- **Admins** page — create admins and assign permissions (superadmin)

### Backend (`Backend/`)

- JWT auth for users and admins (separate secrets)
- Role-based admin permissions (`admin` / `superadmin`)
- Redis-backed OTP with key prefix
- WhatsApp OTP via Twilio (default); SMS optional; console fallback for local dev
- Wallet with admin approval for deposits/withdrawals
- Battle engine with platform fee; prize + loss tracking
- Platform settings stored in MongoDB (editable from admin)
- Color game scheduler via cron (legacy Win Go modes)

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

Edit `Backend/config/local.json` to change **any** setting — ports, OTP expiry, Redis, JWT, Twilio, wallet, battles, etc. Unset keys fall back to `default.json`.

### Secrets (gitignored)

| Path | Purpose |
|------|---------|
| `Backend/config/local.json` | JWT, Redis, Twilio, etc. |
| `Backend/secrets/superadmin.json` | Portal superadmin login credentials |
| `Backend/config/firebase-service-account.json` | Optional Firebase realtime |

```
Backend/secrets/
├── .gitkeep
├── superadmin.example.json   ← committed template
└── superadmin.json           ← created by onboard script (gitignored)
```

### WhatsApp / SMS OTP

OTP channel is controlled by `otp.channel` (`whatsapp` by default, or `sms`).

| Channel config | Behavior |
|----------------|----------|
| `otp.channel: "whatsapp"` + `whatsapp.provider: "console"` | Logs OTP to server console (local dev) |
| `otp.channel: "whatsapp"` + `whatsapp.provider: "twilio"` | Sends OTP via Twilio WhatsApp |
| `otp.channel: "sms"` + `sms.provider: "twilio"` | Sends OTP via Twilio SMS |

**Enable Twilio WhatsApp in `Backend/config/local.json`:**

```json
{
  "otp": { "channel": "whatsapp", "expiryMinutes": 10 },
  "whatsapp": {
    "provider": "twilio",
    "twilio": {
      "from": "whatsapp:+14155238886",
      "countryCode": "+91",
      "contentSid": ""
    }
  }
}
```

Notes:
- Twilio WhatsApp credentials fall back to `sms.twilio.accountSid` / `authToken` if empty.
- For production, set an approved WhatsApp template `contentSid` (variable `1` = OTP, `2` = expiry minutes).
- Sandbox testing: join the Twilio WhatsApp sandbox from the phone before requesting OTP.

**Enable Twilio SMS instead:**

```json
{
  "otp": { "channel": "sms" },
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

Or set environment variables (see `.env.example`).

### Request logging

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
| Auth | `/auth/send-otp`, `/auth/login`, `/auth/logout`, `/auth/profile` |
| Wallet | `/wallet/balance`, `/wallet/deposit`, `/wallet/withdraw`, `/wallet/transactions` |
| Battles | `/battles/create`, `/battles/join`, `/battles/open`, `/battles/running`, `/battles/my` |
| Profile | `/profile/stats`, `/profile/history`, `/profile/kyc` |
| Referral | `/referral/code`, `/referral/stats` |
| Settings | `/settings` (public platform + support WhatsApp) |
| Games | `/games/*` (color prediction) |
| Home | `/home` |

### Admin API (`/api/admin`)

All routes (except login/health) require admin JWT. Actions also require matching permissions.

| Area | Endpoints |
|------|-----------|
| Auth | `/auth/login`, `/auth/logout`, `/auth/profile` |
| Dashboard | `/dashboard` |
| Deposits | `/deposits`, `/deposits/:id/approve`, `/deposits/:id/reject` |
| Withdrawals | `/withdrawals`, `/withdrawals/:id/approve`, `/withdrawals/:id/reject` |
| Battles | `/battles`, `/battles/:id/cancel`, `/battles/:id/complete`, `DELETE /battles/:id` |
| Users | `/users`, `/users/:id/status`, `/users/:id/balance` |
| KYC | `/kyc/pending`, `/kyc/:userId/approve`, `/kyc/:userId/reject` |
| Transactions | `/transactions` |
| Settings | `GET/PUT /settings` |
| Admins | `GET/POST /admins`, `PUT /admins/:id`, `GET /permissions` |

---

## Development Notes

- User frontend proxies `/api` → `http://localhost:5000` (`frontend/bigfun-frontend/proxy.conf.json`)
- Admin portal proxies `/api` → `http://localhost:5000`; app calls `/api/admin/*` (`frontend/bigfun-admin/proxy.conf.json`)
- VS Code: use **Run All (BigFun)** task from `.vscode/tasks.json`
- Each package can also be run independently from its own folder

---

## Production Build

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full first-time production checklist (env vars, S3, OTP, Nginx, superadmin onboard, smoke tests).

**Deploying frontends on Vercel?** See **[DEPLOYMENT-VERCEL.md](./DEPLOYMENT-VERCEL.md)** (API still needs Railway/Render/VPS).

```bash
npm run build
```

Outputs:
- `frontend/bigfun-frontend/dist/bigfun-frontend`
- `frontend/bigfun-admin/dist/bigfun-admin`
- `frontend/bigfun-superadmin/dist/bigfun-superadmin`

Update production API URLs in:
- `frontend/bigfun-frontend/src/environments/environment.prod.ts`
- `frontend/bigfun-admin/src/environments/environment.prod.ts`
- `frontend/bigfun-superadmin/src/environments/environment.prod.ts`

Deploy the Backend with `NODE_ENV=production` and environment variables set. Onboard production superadmin with `onboard:superadmin` and keep `Backend/secrets/` off the server disk in favor of a secret manager when possible.

---

## Package READMEs

- [User frontend](frontend/bigfun-frontend/README.md)
- [Admin portal](frontend/bigfun-admin/README.md)
- [Superadmin portal](frontend/bigfun-superadmin/README.md)

---

## License

ISC
