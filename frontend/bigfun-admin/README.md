# BigFun Admin Portal

Angular 19 admin dashboard for managing deposits, withdrawals, battles, users, and KYC.

> See the [root README](../../README.md) for monorepo setup, prerequisites, and demo credentials.

## Run from monorepo root

```bash
npm run start:admin
```

Portal: **http://localhost:5201** (API proxied to `http://localhost:5050`)

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

## Demo Login

```
Mobile: 9999999999
Password: admin123
```

## Structure

```
src/app/
  core/     → auth, admin API service, guards, interceptors
  pages/    → dashboard, deposits, withdrawals, battles, users, kyc, transactions
  shared/   → admin layout (sidebar)
```
