# First-Time Production Deployment

Step-by-step guide to deploy **Masti Ludo** for the first time.

Suggested domains (replace with yours):

| Service | Example URL |
|---------|-------------|
| User app | `https://play.yourdomain.com` |
| Admin | `https://admin.yourdomain.com` |
| Superadmin | `https://sa.yourdomain.com` |
| API | `https://api.yourdomain.com` |

---

## 0. Prerequisites

- **Node.js 20+** on the API host
- **MongoDB** (Atlas or self-hosted) — reachable from API
- **Redis** (required for OTP) — reachable from API
- **S3 bucket** for battle screenshots (recommended)
- **Twilio WhatsApp** (or SMS) credentials + approved template for production
- Domains + HTTPS (Nginx / Cloudflare / load balancer)
- Server with enough RAM for Node (1–2 GB+ recommended)

---

## 1. Clone & install

```bash
git clone <your-repo-url>
cd test-project   # or your folder name
npm install
```

---

## 2. Backend environment

**Do not copy `local.json` to production.** Use environment variables.

Create a `.env` or set these in your process manager / host UI.

### Required

```bash
NODE_ENV=production
PORT=5000
APP_NAME=Masti Ludo
APP_URL=https://play.yourdomain.com

MONGODB_URI=mongodb+srv://USER:PASS@cluster/bigfun?retryWrites=true&w=majority
REDIS_URL=redis://:PASSWORD@redis-host:6379
# or REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
REDIS_KEY_PREFIX=mastiludo:

JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d
ADMIN_JWT_SECRET=<different-long-random-string>
ADMIN_JWT_EXPIRES_IN=1d
```

### OTP / WhatsApp (production)

```bash
OTP_CHANNEL=whatsapp
OTP_BYPASS_ENABLED=false
# OTP_BYPASS_CODE=   # leave unset / unused in production

WHATSAPP_PROVIDER=twilio
WHATSAPP_TWILIO_ACCOUNT_SID=ACxxxx
WHATSAPP_TWILIO_AUTH_TOKEN=xxxx
WHATSAPP_TWILIO_FROM=whatsapp:+1XXXXXXXXXX
WHATSAPP_TWILIO_COUNTRY_CODE=+91
WHATSAPP_TWILIO_CONTENT_SID=<approved-template-sid>
```

### S3 screenshots

```bash
S3_ENABLED=true
S3_REGION=ap-south-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://your-bucket-name.s3.ap-south-1.amazonaws.com
S3_KEY_PREFIX=battles/
```

Bucket: allow public **read** on `battles/*` (or serve via CloudFront and set `S3_PUBLIC_BASE_URL` to the CDN URL).

### Wallet / support

```bash
UPI_ID=your-upi@bank
MIN_DEPOSIT=100
MIN_WITHDRAW=110
REFERRAL_BONUS=50
SUPPORT_WHATSAPP=91XXXXXXXXXX
SUPPORT_EMAIL=support@yourdomain.com
```

### Logging

```bash
LOG_LEVEL=info
LOG_FORMAT=json
LOG_REQUEST_BODY=false
```

Full env mapping: `Backend/config/custom-environment-variables.json`.

---

## 3. Start the API

From repo root:

```bash
export NODE_ENV=production
# ensure env vars are loaded
npm run start:api
```

Or with PM2:

```bash
cd Backend
pm2 start index.js --name mastiludo-api
pm2 save
```

**Health check**

```bash
curl https://api.yourdomain.com/api/health
```

### Important runtime notes

- Run **one** API instance for battle timeout cron (or accept duplicate cron on multiple instances).
- Redis must stay up — OTP depends on it.
- Keep `/api` reverse-proxied with HTTPS.
- Restrict CORS later to your frontend origins (currently open for simplicity).

---

## 4. Create production Superadmin

```bash
npm run onboard:superadmin -- \
  --mobile 9XXXXXXXXX \
  --name "Super Admin" \
  --generate \
  --promote
```

Save the printed credentials securely (password manager).  
Do **not** commit `Backend/secrets/superadmin.json`. Prefer deleting it from the server after copying credentials into a vault.

Log in at: `https://sa.yourdomain.com`

---

## 5. Build frontends

### 5.1 Set production API URLs

Edit before building:

**User** — `frontend/bigfun-frontend/src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api',
};
```

**Admin** — `frontend/bigfun-admin/src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api/admin',
};
```

**Superadmin** — `frontend/bigfun-superadmin/src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api/superadmin',
};
```

> If you serve a frontend **behind the same domain** as the API (path reverse-proxy), you can use relative URLs like `'/api'` / `'/api/admin'` / `'/api/superadmin'`.

### 5.2 Build

```bash
npm run build
```

Outputs:

- `frontend/bigfun-frontend/dist/bigfun-frontend/`
- `frontend/bigfun-admin/dist/bigfun-admin/`
- `frontend/bigfun-superadmin/dist/bigfun-superadmin/`

Upload each `dist/...` folder to static hosting (S3+CloudFront, Nginx, etc.).

### 5.3 SPA routing

For each site, configure fallback so deep links work:

```
try_files $uri $uri/ /index.html;
```

---

## 6. Sample Nginx (API + one SPA)

```nginx
# API
server {
  listen 443 ssl;
  server_name api.yourdomain.com;

  # ssl_certificate ...;
  # ssl_certificate_key ...;

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 8m;   # screenshot uploads
  }
}

# User app
server {
  listen 443 ssl;
  server_name play.yourdomain.com;
  root /var/www/mastiludo-user;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Repeat similar blocks for admin and superadmin roots.

---

## 7. First-login checklist (after deploy)

1. Open Superadmin → log in with onboarded credentials  
2. Create at least one **Admin** (with permissions)  
3. Set **platform settings**: UPI, support WhatsApp, fees  
4. Open User app → send OTP → login (real WhatsApp, not bypass)  
5. Deposit flow (manual UPI as configured)  
6. Create battle → join from second account → start → report win with screenshot  
7. Confirm screenshot URL is on **S3** (not `/uploads/...`)  
8. Admin → verify battle / payout  

---

## 8. Security checklist

| Item | Action |
|------|--------|
| JWT secrets | Strong & unique (user vs admin) |
| OTP bypass | **OFF** (`OTP_BYPASS_ENABLED=false`) |
| `local.json` | Not on server / not in git |
| `secrets/` | Not committed; remove from disk after onboard |
| Seed data | Do not use demo passwords in prod |
| HTTPS | All four hosts |
| S3 keys | IAM user with least privilege (PutObject on bucket prefix) |
| Redis | Password + private network |
| MongoDB | Auth + IP allowlist / VPC |
| CORS | Restrict to your domains when ready |

---

## 9. What not to do

- Do not run `npm run seed` on production unless you intentionally want demo data  
- Do not leave `OTP_BYPASS_ENABLED=true`  
- Do not point frontends at `localhost:5000` in prod builds  
- Do not rely on Angular `proxy.conf.json` in production (dev only)  
- Do not commit AWS / Twilio / JWT secrets  

---

## 10. Quick command summary

```bash
# Install
npm install

# API (with env vars already set)
NODE_ENV=production npm run start:api

# Superadmin
npm run onboard:superadmin -- --mobile 9XXXXXXXXX --name "Super Admin" --generate --promote

# Frontends (after editing environment.prod.ts files)
npm run build
```

---

## 11. Smoke-test URLs

```
GET  https://api.yourdomain.com/api/health
POST https://api.yourdomain.com/api/auth/send-otp
GET  https://play.yourdomain.com
GET  https://admin.yourdomain.com
GET  https://sa.yourdomain.com
```

---

## Support

- Backend env map: `Backend/config/custom-environment-variables.json`
- Local template (dev only): `Backend/config/local.example.json`
- Main README: `README.md`
