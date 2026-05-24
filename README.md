# TailMate

**TailMate** is a full-stack pet care platform: adoption and matchmaking, vet consultations (booking and video calls), marketplace listings, real-time chat, payments (Stripe), and admin/doctor dashboards.

This README is the single guide you need: clone the repo, configure environment variables, install dependencies, and run the app locally.

---

## Table of contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start (local development)](#quick-start-local-development)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Docker (backend + Redis only)](#docker-backend--redis-only)
- [Optional integrations](#optional-integrations)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Architecture

| Layer      | Stack                                      | Default URL              |
|-----------|---------------------------------------------|--------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4 | http://localhost:3000    |
| Backend   | Node.js 20, Express 5, TypeScript, Socket.IO | http://localhost:4000  |
| Database  | MongoDB (Atlas or local)                    | via `MONGO_URI`          |
| Cache     | Redis 7                                     | via `REDIS_URL`          |

```mermaid
flowchart LR
  Browser["Browser :3000"] --> API["Backend API :4000"]
  API --> Mongo[(MongoDB)]
  API --> Redis[(Redis)]
  API --> Stripe[Stripe]
  API --> Cloudinary[Cloudinary]
  API --> Brevo[Brevo Email]
  Browser --> Mapbox[Mapbox]
```

---

## Prerequisites

Install these before you begin:

| Tool        | Version   | Notes |
|------------|-----------|-------|
| **Node.js** | 20.x LTS  | Backend Docker image uses Node 20 |
| **npm**     | 9+        | Comes with Node |
| **Git**     | any recent | |
| **MongoDB** | —         | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier is fine |
| **Redis**   | 7.x       | Local install or Docker (see below) |

Optional (for full feature parity):

- [Stripe](https://dashboard.stripe.com) (test mode keys)
- [Google Cloud Console](https://console.cloud.google.com) (OAuth)
- [Cloudinary](https://cloudinary.com) (image uploads)
- [Brevo](https://www.brevo.com) (transactional email / OTP)
- [Mapbox](https://account.mapbox.com) (location search on frontend)

---

## Quick start (local development)

### 1. Clone the repository

```bash
git clone https://github.com/Razirasheed03/Tailmate.git
cd Tailmate
```

### 2. Start Redis

**Option A — Docker (recommended)**

```bash
docker run -d --name tailmate-redis -p 6379:6379 redis:7.4-alpine
```

**Option B — Homebrew (macOS)**

```bash
brew install redis
brew services start redis
```

### 3. MongoDB

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (or run MongoDB locally).
2. Create a database user and allow your IP (for dev, `0.0.0.0/0` is common).
3. Copy the connection string, e.g.  
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/tailmate?retryWrites=true&w=majority`

### 4. Backend environment

Create `backend/.env`:

```bash
touch backend/.env
```

Paste and fill in (see [Backend variables](#backend-environment-variables)):

```env
# --- Required to boot ---
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/tailmate?retryWrites=true&w=majority
REDIS_URL=redis://127.0.0.1:6379

JWT_SECRET=change-me-use-openssl-rand-base64-32
REFRESH_SECRET=change-me-another-long-random-string

# --- URLs (local dev) ---
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:3000

# --- Stripe (test keys from dashboard) ---
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx

# --- Email (Brevo) — needed for signup OTP / password reset ---
BREVO_API_KEY=xkeysib-xxxxxxxx
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=TailMate

# --- Google OAuth (optional; skip if you only use email login) ---
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# --- Cloudinary (optional; needed for chat/media uploads) ---
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=xxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxx

# --- Dev-only marketplace order sync (optional) ---
# ENABLE_MARKETPLACE_ORDER_SYNC=true
```

Generate strong secrets:

```bash
openssl rand -base64 32   # use for JWT_SECRET
openssl rand -base64 32   # use for REFRESH_SECRET
```

### 5. Frontend environment

```bash
touch frontend/.env
```

Add to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token
```

> `VITE_API_BASE_URL` must include the `/api` prefix — the app calls routes like `/api/auth/login` via this base URL.

### 6. Install dependencies

```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 7. Run both services

Use **two terminals**:

**Terminal 1 — API**

```bash
cd backend
npm run dev
```

Expected logs: MongoDB connected, Redis connected, `Server running on 4000`.

**Terminal 2 — Web app**

```bash
cd frontend
npm run dev
```

Vite serves the UI at **http://localhost:3000**.

### 8. Verify

- API health: http://localhost:4000/api/health → `{ "status": "ready" }` (after DB is up)
- App: open http://localhost:3000

---

## Environment variables

### Backend environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | API port (use `4000` locally) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | Yes | e.g. `redis://127.0.0.1:6379` or `redis://redis:6379` in Docker network |
| `JWT_SECRET` | Yes | Access token signing secret |
| `REFRESH_SECRET` | Yes | Refresh token signing secret |
| `NODE_ENV` | Recommended | `development` or `production` |
| `FRONTEND_URL` | Recommended | CORS / redirects (default dev: `http://localhost:3000`) |
| `APP_URL` | Recommended | Stripe Connect return URLs (often same as frontend in dev) |
| `STRIPE_SECRET_KEY` | Yes* | Stripe secret key (`sk_test_...`) — imported at server startup |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | From Stripe CLI or Dashboard webhook endpoint |
| `BREVO_API_KEY` | For email auth | Brevo API key |
| `BREVO_SENDER_EMAIL` | For email auth | Verified sender in Brevo |
| `BREVO_SENDER_NAME` | Optional | Display name (default: TailMate Support) |
| `GOOGLE_CLIENT_ID` | For Google login | OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | For Google login | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | For Google login | `http://localhost:4000/api/auth/google/callback` |
| `CLOUDINARY_*` | For uploads | Cloud name, API key, API secret |
| `ENABLE_MARKETPLACE_ORDER_SYNC` | Optional | Set `true` in production to enable marketplace order sync route guard |
| `REFRESH_TOKEN_COOKIE_NAME` | Optional | Cookie name (default: `refreshToken`) |
| `REFRESH_TOKEN_EXPIRY` | Optional | Cookie max-age in ms |

\*Payment routes load the Stripe SDK at startup; use a valid **test** key even if you are not testing checkout yet.

### Frontend environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API root, e.g. `http://localhost:4000/api` |
| `VITE_MAPBOX_TOKEN` | For maps | Mapbox public token (`pk....`) |

Restart the Vite dev server after changing any `VITE_*` variable.

---

## Running the app

### Development (recommended)

| Service  | Command              | URL |
|----------|----------------------|-----|
| Backend  | `cd backend && npm run dev` | http://localhost:4000 |
| Frontend | `cd frontend && npm run dev` | http://localhost:3000 |

- Hot reload: backend via `ts-node-dev`, frontend via Vite HMR.
- Socket.IO and WebRTC use the backend origin (derived from `VITE_API_BASE_URL` without the `/api` suffix).

### Production build

**Backend**

```bash
cd backend
npm run build
npm start
```

Runs compiled output from `backend/dist/server.js` (set `PORT` and other env vars in production).

**Frontend**

```bash
cd frontend
npm run build
npm run preview
```

Deploy the `frontend/dist` folder to any static host (e.g. Vercel). Point `VITE_API_BASE_URL` at your production API URL at **build time**.

---

## Docker (backend + Redis only)

The repo includes `docker-compose.yml` for the **API + Redis**. It does **not** run MongoDB or the frontend.

1. Create `backend/.env` with at least `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET`, Stripe keys, etc.
2. Set Redis for the compose network:

   ```env
   REDIS_URL=redis://redis:6379
   ```

3. From the project root:

   ```bash
   docker compose up --build
   ```

API: http://localhost:4000

You still need to run MongoDB (Atlas URI in `.env`) and the frontend separately (`npm run dev` in `frontend/` with `VITE_API_BASE_URL=http://localhost:4000/api`).

---

## Optional integrations

### Stripe (payments & marketplace)

1. Create a [Stripe](https://dashboard.stripe.com) account → **Developers → API keys** → copy **Secret key** (`sk_test_...`).
2. Local webhooks (for `checkout.session.completed`, etc.):

   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```

   Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

3. In development, marketplace checkout can also finalize via the success-page session fetch when `NODE_ENV` is not `production`.

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web).
2. **Authorized redirect URI:**  
   `http://localhost:4000/api/auth/google/callback`
3. Copy Client ID and Secret into `backend/.env`.
4. Login from the app uses: `{VITE_API_BASE_URL}/auth/google` → redirects through Google → callback.

### Brevo (email OTP & resets)

1. [Brevo](https://www.brevo.com) → SMTP & API → create API key.
2. Verify a sender email/domain.
3. Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and optionally `BREVO_SENDER_NAME`.

### Cloudinary (uploads)

1. [Cloudinary](https://cloudinary.com) dashboard → copy cloud name, API key, and secret.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### Mapbox (location input)

1. [Mapbox](https://account.mapbox.com/access-tokens/) → create a **public** token (`pk....`).
2. Set `VITE_MAPBOX_TOKEN` in `frontend/.env`.

---

## Project structure

```
Tailmate/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express + Socket.IO entry
│   │   ├── config/            # env, MongoDB, Redis, Cloudinary
│   │   ├── routes/            # REST API routes
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   └── sockets/           # Real-time chat / calls
│   ├── dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/             # User, doctor, admin views
│   │   ├── components/
│   │   ├── services/          # API clients
│   │   └── context/           # Auth, etc.
│   └── package.json
├── docker-compose.yml         # backend + redis
└── README.md                  # this file
```

### Main API route groups

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Signup, OTP, login, Google OAuth, tokens |
| `/api/user`, `/api/doctor`, `/api/admin` | Role-specific APIs |
| `/api/marketplace` | Listings and orders |
| `/api/checkout`, `/api/payments` | Stripe checkout & webhooks |
| `/api/chat`, `/api/consultations` | Messaging and video consultations |
| `/api/matchmaking` | Pet adoption matching |
| `/api/health` | Readiness probe |

---

## Scripts

### Backend (`backend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API with hot reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build (`node dist/server.js`) |

### Frontend (`frontend/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server on port **3000** |
| `npm run build` | Typecheck + production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |

---

## Troubleshooting

### `Missing the environment variable PORT` (or `MONGO_URI`, `REDIS_URL`)

Create `backend/.env` in the `backend` folder (not the repo root). Required keys are validated in `backend/src/config/env.ts`.

### Redis connection errors

- Confirm Redis is running: `redis-cli ping` → `PONG`
- `REDIS_URL` must match your setup:
  - Local: `redis://127.0.0.1:6379`
  - Docker Compose backend service: `redis://redis:6379`

### MongoDB connection failed

- Check username/password in `MONGO_URI`
- Atlas: Network Access must allow your IP
- Wait a few seconds after starting the API — `/api/health` returns `warming` until indexes are ready

### Frontend cannot reach API / CORS errors

- `VITE_API_BASE_URL` must be `http://localhost:4000/api` (include `/api`)
- Backend allows `http://localhost:3000` by default in `server.ts`
- Restart Vite after env changes

### Google login redirect mismatch

`GOOGLE_REDIRECT_URI` must exactly match the URI configured in Google Cloud Console.

### Stripe webhook not firing locally

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Update `STRIPE_WEBHOOK_SECRET` with the CLI webhook secret.

### Port already in use

- Backend: change `PORT` in `backend/.env`
- Frontend: `npm run dev` uses port 3000; override with `npx vite --port 3001` if needed

---

## License

See repository license terms (if applicable). Third-party services (Stripe, Mapbox, MongoDB Atlas, etc.) have their own terms of use.

---

**You’re set.** After Redis, MongoDB, both `.env` files, and `npm install` in `backend` and `frontend`, run `npm run dev` in each folder and open http://localhost:3000.
