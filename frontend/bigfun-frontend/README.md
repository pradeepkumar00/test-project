# BigFun Frontend

User-facing Angular 19 app for the BigFun gaming platform.

> See the [root README](../../README.md) for monorepo setup, prerequisites, and demo credentials.

## Run from monorepo root

```bash
npm run start:frontend
```

App: **http://localhost:5200** (API proxied to `http://localhost:5000`)

## Run from this folder

```bash
npm install
npm start
```

## Pages

| Route | Screen |
|-------|--------|
| `/login` | Login |
| `/register?refer=CODE` | Register with referral |
| `/home` | Battles — create/join |
| `/wallet` | Deposit & withdraw |
| `/profile` | Profile, KYC, history |
| `/refer` | Refer & earn |
| `/support` | Support & FAQs |

## Demo Login

```
Mobile: 9876543210
Password: demo123
```

## Structure

```
src/app/
  core/     → services, guards, interceptors, models
  pages/    → login, register, home, wallet, profile, refer, support
  shared/   → header, bottom-nav
```
