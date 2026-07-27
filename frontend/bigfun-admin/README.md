# Masti Ludo Admin Portal

Angular 19 admin dashboard for deposits, withdrawals, battles, users, KYC, settings, and admin access control.

> See the [root README](../../README.md) for monorepo setup, prerequisites, and credentials.

## Run from monorepo root

```bash
npm run start:admin
```

Portal: **http://localhost:5201** (API proxied to `http://localhost:5000`, routes under `/api/admin`)

## Run from this folder

```bash
npm install
npm start
```

## Pages

| Route | Screen | Typical permission |
|-------|--------|--------------------|
| `/login` | Admin sign in | — |
| `/dashboard` | Platform stats | `dashboard.view` |
| `/deposits` | Approve/reject deposits | `deposits.view` / `deposits.manage` |
| `/withdrawals` | Approve/reject withdrawals | `withdrawals.view` / `withdrawals.manage` |
| `/battles` | Cancel, complete, delete | `battles.view` / `battles.manage` |
| `/users` | Users, status, balance | `users.view` / `users.manage` / `users.balance` |
| `/kyc` | Pending KYC review | `kyc.view` / `kyc.manage` |
| `/transactions` | Transaction log | `transactions.view` |
| `/settings` | Platform settings | `settings.view` / `settings.manage` |
| `/admins` | Create admins & permissions | `admins.manage` |

**Superadmin** has all permissions. **Admin** only sees and can perform what was assigned.

## Superadmin credentials

Create/reset from the repo root (password saved to a gitignored secrets file):

```bash
npm run onboard:superadmin -- --mobile 9999999999 --generate --promote
```

Credentials: `Backend/secrets/superadmin.json`  
Do not commit that file or show passwords on the login page.

## Structure

```
src/app/
  core/     → auth (permissions), admin API, guards, interceptors
  pages/    → dashboard, deposits, withdrawals, battles, users, kyc,
              transactions, settings, admins
  shared/   → admin layout (permission-filtered sidebar)
```
