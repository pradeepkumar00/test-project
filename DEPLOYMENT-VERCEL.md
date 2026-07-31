# Deploy to Vercel (Frontends)

Vercel is a good fit for the **Angular apps**. The **Express API** (MongoDB + Redis + second-level crons) should run on a normal Node host (Railway, Render, Fly.io, VPS) — not Vercel serverless.

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ User (Vercel)   │     │ Admin (Vercel)  │     │ Superadmin       │
│ play.xxx.com    │     │ admin.xxx.com   │     │ (Vercel)         │
└────────┬────────┘     └────────┬────────┘     └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │ API (Railway / Render) │
                    │ api.xxx.com            │
                    │ MongoDB + Redis + S3   │
                    └────────────────────────┘
```

---

## Step 1 — Deploy the Backend first (not Vercel)

Use **Railway**, **Render**, or a VPS. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for env vars.

You need a public HTTPS API URL, e.g.:

```text
https://mastiludo-api.up.railway.app
```

or

```text
https://api.yourdomain.com
```

Confirm:

```bash
curl https://YOUR-API-HOST/api/health
```

---

## Step 2 — Point Angular apps at that API

Edit production environments **before** deploying to Vercel:

### User — `frontend/bigfun-frontend/src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-API-HOST/api',
};
```

### Admin — `frontend/bigfun-admin/src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-API-HOST/api/admin',
};
```

### Superadmin — `frontend/bigfun-superadmin/src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://YOUR-API-HOST/api/superadmin',
};
```

Commit these changes (or set them in a release branch).

---

## Step 3 — Create 3 Vercel projects (one per app)

In [vercel.com](https://vercel.com) → **Add New Project** → import this Git repo.

Create **three** projects with these settings:

### Project A — User app

| Setting | Value |
|---------|--------|
| Root Directory | `frontend/bigfun-frontend` |
| Framework Preset | Other |
| Build Command | `npm run build` (from `vercel.json`) |
| Output Directory | `dist/bigfun-frontend/browser` |
| Install Command | `npm install` |
| Node.js Version | **20.x** |

### Project B — Admin

| Setting | Value |
|---------|--------|
| Root Directory | `frontend/bigfun-admin` |
| Output Directory | `dist/bigfun-admin/browser` |
| Node.js Version | **20.x** |

### Project C — Superadmin

| Setting | Value |
|---------|--------|
| Root Directory | `frontend/bigfun-superadmin` |
| Output Directory | `dist/bigfun-superadmin/browser` |
| Node.js Version | **20.x** |

Each folder already has a `vercel.json` with SPA rewrites (`/*` → `index.html`).

---

## Step 4 — Custom domains (optional)

In each Vercel project → **Settings → Domains**:

- User → `play.yourdomain.com`
- Admin → `admin.yourdomain.com`
- Superadmin → `sa.yourdomain.com`

Add DNS records as Vercel instructs (usually CNAME to `cname.vercel-dns.com`).

---

## Step 5 — CORS on the API

Allow your Vercel domains on the backend. Until you tighten CORS, the API currently uses `cors()` open (all origins), so it will work immediately. For production, restrict to:

```text
https://play.yourdomain.com
https://admin.yourdomain.com
https://sa.yourdomain.com
https://*.vercel.app
```

---

## Deploy via CLI (optional)

```bash
# Install once
npm i -g vercel

# User app
cd frontend/bigfun-frontend
vercel          # preview
vercel --prod   # production

# Admin
cd ../bigfun-admin
vercel --prod

# Superadmin
cd ../bigfun-superadmin
vercel --prod
```

When prompted, set **Root Directory** correctly if deploying from monorepo root instead.

---

## Why not put the API on Vercel?

| Feature | This API needs | Vercel serverless |
|---------|----------------|-------------------|
| Redis OTP store | Always-on Redis | Possible, but cold starts hurt |
| Battle timeout cron (every 15s) | Persistent process | Not suitable |
| Game scheduler (every 1s) | Persistent process | Not suitable |
| Long Express + multer uploads | Traditional Node | Awkward / limited |
| Mongo connections | Stable process | Needs careful pooling |

**Recommended API hosts:** Railway, Render, Fly.io, DigitalOcean App Platform, or any VPS + PM2.

---

## Quick checklist

- [ ] API live with `/api/health`
- [ ] MongoDB + Redis connected
- [ ] S3 enabled for screenshots
- [ ] OTP bypass **disabled**
- [ ] `environment.prod.ts` files point to API host
- [ ] 3 Vercel projects created (correct root dirs)
- [ ] Node 20 on Vercel
- [ ] Smoke test: login → create battle → admin verify

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page / 404 on refresh | Confirm `vercel.json` rewrites and output is `.../browser` |
| API calls fail (CORS) | Check API is HTTPS; temporarily open CORS; verify `apiUrl` |
| Build fails (Angular budgets) | Raise budgets in `angular.json` or fix bundle size |
| Wrong app deployed | Root Directory must be the specific `frontend/...` folder |
| OTP fails | Redis must be reachable from the **API** host, not from Vercel |
