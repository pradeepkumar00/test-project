# Masti Ludo — User App

Player-facing Angular 19 app for Ludo battles, wallet, referrals, and profile.

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
| `/login` | OTP login (optional referral on first signup) |
| `/home` | Ludo Classic — create/join battles |
| `/wallet` | Deposit, winning & bonus balances |
| `/history` | Battle history (won / lost / open / live) |
| `/profile` | Profile, KYC, battle & earning stats |
| `/refer` | Refer & earn |
| `/support` | Help Center / WhatsApp |

## Demo player (after seed)

```
Mobile: 9876543210
```

Use OTP from the API console when `sms.provider` is `console`.

## Structure

```
src/app/
  core/     → services, guards, interceptors, models
  pages/    → login, home, wallet, history, profile, refer, support, battles
  shared/   → layout (header, menu, bottom nav)
```
