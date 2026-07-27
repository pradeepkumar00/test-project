# Masti Ludo Superadmin Portal

Dedicated Angular 19 portal for **superadmin only** — create staff admins, assign permissions, and manage platform settings.

Uses a separate API namespace and token storage from the regular Admin portal.

> See the [root README](../../README.md) for monorepo setup.

## Run

```bash
# From repo root (API must be running)
npm run start:superadmin
```

Portal: **http://localhost:5202/login**  
API: `/api/superadmin` (proxied to `http://localhost:5000`)

## Login

Only accounts with `role: superadmin` are accepted.

```bash
# Credentials in Backend/secrets/superadmin.json
npm run onboard:superadmin -- --mobile 9999999999 --generate --promote
```

| | |
|--|--|
| URL | http://localhost:5202/login |
| Mobile | see `Backend/secrets/superadmin.json` |
| Password | see `Backend/secrets/superadmin.json` |

Token is stored as `bigfun_superadmin_token` (separate from admin portal).

## Pages

| Route | Purpose |
|-------|---------|
| `/login` | Superadmin sign-in |
| `/dashboard` | Platform stats |
| `/admins` | Create/edit admins + permissions |
| `/settings` | Platform settings |

## Token validation

1. Login → `POST /api/superadmin/auth/login` (rejects non-superadmin)
2. Bearer token on every request
3. Backend `adminAuth` + `superAdminOnly` on all routes after login
4. Frontend `authGuard` requires token + `role === 'superadmin'`

Staff admins use **http://localhost:5201** (`/api/admin`) instead.
