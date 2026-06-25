# BigFun Admin Portal

Angular 19 admin dashboard for managing deposits, withdrawals, battles, users, and KYC.

> See the [root README](../../README.md) for monorepo setup, prerequisites, and demo credentials.

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

| Route | Screen |
|-------|--------|
| `/login` | Admin sign in |
| `/dashboard` | Platform stats |
| `/deposits` | Approve/reject deposits |
| `/withdrawals` | Approve/reject withdrawals |
| `/battles` | Cancel, complete, delete battles |
| `/users` | User list, status, balance adjust |
| `/kyc` | Pending KYC review |
| `/transactions` | Transaction log |

## Admin access

Create a superadmin for local dev (never commit real production passwords):

```bash
npm run onboard:superadmin -- --mobile <10-digit> --password '<strong-password>' --name "Admin"
```

Do not expose admin credentials on the login page or in public docs.

## Structure

```
src/app/
  core/     → auth, admin API service, guards, interceptors
  pages/    → dashboard, deposits, withdrawals, battles, users, kyc, transactions
  shared/   → admin layout (sidebar)
```
