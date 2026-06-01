# MeetupMate — Deployment guide (next steps)

This guide explains how to put MeetupMate on the internet so friends can open it in a browser on their phones or laptops. Local development (`npm run dev` on your machine) is only reachable from your computer; deployment means running the app on a server with a **public URL**, **HTTPS**, and a **hosted PostgreSQL** database.

---

## What you are deploying

MeetupMate is a single **Next.js** application that includes:

- The web UI (pages, calendar, groups)
- API routes (`/api/groups`, `/api/auth`, etc.)
- Authentication (Better Auth, cookie-based sessions)

You also need a separate **PostgreSQL** database. The app does not work without it.

```text
  User phone/browser
         |
         |  HTTPS (https://meetupmate.yourdomain.com)
         v
  +------------------+
  |  MeetupMate app  |  (Docker / Fly / Railway / VPS)
  |  port 3000       |
  +--------+---------+
           |
           |  DATABASE_URL (private network)
           v
  +------------------+
  |  PostgreSQL      |  (Neon, Supabase, Fly Postgres, Railway, etc.)
  +------------------+
```

---

## Before you start (checklist)

| Item | Why it matters |
|------|----------------|
| **Domain name** (optional but recommended) | Invite links and auth callbacks should use a stable URL, e.g. `https://meetupmate.example.com`. |
| **HTTPS** | Browsers require secure cookies for login; all serious hosts provide free TLS (Let’s Encrypt). |
| **PostgreSQL** | Production database; do not expose it to the public internet without firewall rules. |
| **Secrets** | `BETTER_AUTH_SECRET` must be long and random; never commit it to git. |
| **Public URL env vars** | `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the URL users type in the browser (including `https://`). |
| **Email (for magic links)** | Without SMTP, magic-link sign-in only logs links on the server—fine for you alone, not for friends. |
| **Migrations** | Schema is applied with `npx prisma migrate deploy` against the production database (once per release). |

Generate an auth secret locally:

```bash
npx auth secret
```

Copy the value into your host’s secret store as `BETTER_AUTH_SECRET`.

---

## Required environment variables (production)

Set these on whatever platform runs the app:

| Variable | Example | Notes |
|----------|---------|--------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db?sslmode=require` | Use the provider’s connection string; enable SSL in production. |
| `BETTER_AUTH_SECRET` | (output of `npx auth secret`) | Required. |
| `BETTER_AUTH_URL` | `https://meetupmate.example.com` | Must be the public origin; no trailing slash. |
| `NEXT_PUBLIC_APP_URL` | `https://meetupmate.example.com` | Used in invite links; must match what users share. |
| `NODE_ENV` | `production` | Usually set automatically by the host. |

Optional:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | “Sign in with Google” |
| SMTP settings | Send magic-link emails (see [Email for magic links](#email-for-magic-links)) |

After changing `NEXT_PUBLIC_APP_URL` or auth settings, **redeploy** so the build/runtime picks them up.

---

## Run database migrations (every environment)

After the database exists and `DATABASE_URL` points to it, run migrations **from your laptop or CI** (not only inside the running app):

```bash
cd /path/to/MeetupMate
export DATABASE_URL="postgresql://..."   # production URL
npm install
npx prisma migrate deploy
```

You should see `Applying migration` / `All migrations have been successfully applied`.

Repeat this when you pull new versions that include files under `prisma/migrations/`.

---

## Option A — Fly.io (good default: app + HTTPS + region control)

Fly runs the included [Dockerfile](Dockerfile) and [fly.toml](fly.toml). EU users often pick `ams` (Amsterdam); change `primary_region` in `fly.toml` if needed.

### 1. Install CLI and log in

```bash
# https://fly.io/docs/hands-on/install-flyctl/
fly auth login
```

### 2. Create the app (first time only)

From the project root:

```bash
fly apps create meetupmate-yourname   # name must be globally unique
```

Edit `fly.toml` and set `app = "meetupmate-yourname"` to match.

### 3. Create PostgreSQL on Fly

```bash
fly postgres create --name meetupmate-db --region ams
fly postgres attach meetupmate-db -a meetupmate-yourname
```

This sets `DATABASE_URL` on the app automatically. Alternatively, use [Neon](https://neon.tech) and set `DATABASE_URL` manually (see Option D).

### 4. Set secrets

Use your real public URL once you know it (Fly gives `https://meetupmate-yourname.fly.dev`):

```bash
fly secrets set \
  BETTER_AUTH_SECRET="paste-secret-here" \
  BETTER_AUTH_URL="https://meetupmate-yourname.fly.dev" \
  NEXT_PUBLIC_APP_URL="https://meetupmate-yourname.fly.dev"
```

### 5. Deploy

```bash
fly deploy
```

### 6. Migrate production DB

```bash
# Option 1: from your machine (recommended)
export DATABASE_URL="$(fly ssh console -a meetupmate-yourname -C 'printenv DATABASE_URL' 2>/dev/null || fly secrets list -a meetupmate-yourname)"
# Easier: copy DATABASE_URL from Fly dashboard → Postgres → Connection string
npx prisma migrate deploy
```

Or run a one-off machine:

```bash
fly ssh console -a meetupmate-yourname
# inside VM, if node/prisma available, or run locally with copied DATABASE_URL
```

### 7. Custom domain (optional)

```bash
fly certs add meetupmate.example.com -a meetupmate-yourname
```

Add the DNS records Fly shows (usually `A` / `AAAA` or `CNAME`). Then update secrets:

```bash
fly secrets set \
  BETTER_AUTH_URL="https://meetupmate.example.com" \
  NEXT_PUBLIC_APP_URL="https://meetupmate.example.com"
fly deploy
```

### 8. Verify

- Open `https://meetupmate-yourname.fly.dev`
- Sign up with email/password (works without SMTP)
- Create a group → generate invite → open invite in a private/incognito window

---

## Option B — Railway (simple UI, Postgres plugin)

1. Push the repo to GitHub (if not already).
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select MeetupMate.
3. Add a **PostgreSQL** service to the project.
4. On the web service, set variables from the Postgres service’s `DATABASE_URL`, plus:
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL` = Railway’s public URL (e.g. `https://meetupmate-production.up.railway.app`)
   - `NEXT_PUBLIC_APP_URL` = same URL
5. Set **Build** to use the Dockerfile, or use Nixpacks with build command `npm run build` and start `npm run start` (Dockerfile is more reliable for this repo).
6. Under **Settings → Networking**, generate a **public domain**.
7. From your computer, with production `DATABASE_URL` (copy from Railway):

   ```bash
   npx prisma migrate deploy
   ```

8. Redeploy if you changed `NEXT_PUBLIC_APP_URL`.

Railway can also run migrations in a **deploy hook** or one-off job; at minimum, run `prisma migrate deploy` manually the first time.

---

## Option C — VPS + Docker (Hetzner, DigitalOcean, etc.)

Full control: you manage the server, firewall, and updates.

### 1. Server

- Ubuntu 22.04+, 1 GB+ RAM
- Open ports **80** and **443** (and **22** for SSH)
- Point DNS `A` record to the server IP

### 2. Install Docker on the server

Follow [Docker’s install guide](https://docs.docker.com/engine/install/ubuntu/).

### 3. Database

Either:

- **Managed Postgres** (Neon/Supabase) — recommended; only the app server needs outbound internet, DB stays private, or  
- **Postgres on the same VPS** — use Docker Compose; do not expose port 5432 to the world.

Example managed URL:

```text
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 4. Build and run the app

On the server, clone the repo:

```bash
git clone https://github.com/Glaabo/MeetupMate.git
cd MeetupMate
```

Create `.env` (never commit):

```bash
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="https://meetupmate.example.com"
NEXT_PUBLIC_APP_URL="https://meetupmate.example.com"
```

Build and run:

```bash
docker build -t meetupmate .
docker run -d --name meetupmate --restart unless-stopped -p 127.0.0.1:3000:3000 --env-file .env meetupmate
```

Run migrations from your laptop or the server (with Node installed):

```bash
export DATABASE_URL="..."
npx prisma migrate deploy
```

### 5. Reverse proxy + HTTPS (Caddy example)

Install [Caddy](https://caddyserver.com/docs/install) so it terminates TLS and proxies to the container:

```text
meetupmate.example.com {
    reverse_proxy localhost:3000
}
```

Reload Caddy. Users visit `https://meetupmate.example.com`.

### 6. Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Option D — Vercel (frontend host) + Neon (database)

MeetupMate can run on Vercel because it is a standard Next.js app, but you must:

1. Create a **Neon** (or Supabase) Postgres project and copy `DATABASE_URL`.
2. In Vercel → Project → **Environment Variables**, add all required variables for **Production**.
3. Set **Build Command** to `prisma generate && npm run build` (already in `package.json` `build` script).
4. Connect the GitHub repo and deploy.
5. Run migrations against Neon (from local machine):

   ```bash
   export DATABASE_URL="postgresql://...neon..."
   npx prisma migrate deploy
   ```

6. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://your-project.vercel.app` (or custom domain).

**Note:** Serverless cold starts and connection pooling — use Neon’s pooled connection string if offered (`?pgbouncer=true` or the “pooled” URL Neon shows).

---

## Email for magic links

Friends who use **magic link** sign-in need email delivery. Email/password works without SMTP.

The app logs magic links to the server console when SMTP is not configured. For production, configure a provider (Resend, SendGrid, Mailgun, Amazon SES, etc.) and wire it in [src/lib/auth.ts](src/lib/auth.ts) inside `sendMagicLinkEmail` (today it only logs; extending that function to send via your provider is the intended next step).

Until then, tell users to sign up with **email + password**, or implement SMTP and redeploy.

---

## Google OAuth (optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web).
2. **Authorized JavaScript origins:** `https://your-public-domain.com`
3. **Authorized redirect URIs:** `https://your-public-domain.com/api/auth/callback/google`  
   (confirm exact path in Better Auth docs if this differs after upgrades.)
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on your host.
5. Redeploy.

---

## Post-deploy testing

Use this list before sharing with friends:

1. **Homepage** loads over `https://`.
2. **Sign up / sign in** (password) works; session persists after refresh.
3. **Create group** → name appears under “Your groups”.
4. **Generate invite** → copy link → open in another browser/profile → **accept invite** → user joins group.
5. **Edit availability** → tap days → reload page → days still selected.
6. **Shared calendar** shows counts; green days match your group rule.
7. **Settings → Download my data** returns JSON.
8. Invite link uses `NEXT_PUBLIC_APP_URL` (not `localhost`).

---

## Security and privacy reminders

- Use **HTTPS only** in production; set both URL env vars to `https://...`.
- Keep `DATABASE_URL` and `BETTER_AUTH_SECRET` in the host secret manager, not in git.
- Restrict database access to the app’s IP or private network where possible.
- Schedule **database backups** (Neon/Fly/Railway often include this; on a VPS, use `pg_dump` + cron).
- Document for users what you store (see in-app `/privacy`); host in a region you are comfortable with (e.g. EU for EU friends).

---

## Updating the live app

1. Pull latest code (or merge PR).
2. Run `npx prisma migrate deploy` if there are new migrations.
3. Redeploy (e.g. `fly deploy`, Railway redeploy, `docker build` + restart).
4. Smoke-test sign-in and one group flow.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Login works locally, fails in production | `BETTER_AUTH_URL` wrong or `http` instead of `https` | Match exact public URL; redeploy. |
| Invite links go to `localhost` | `NEXT_PUBLIC_APP_URL` not set at build/runtime | Set on host; rebuild/redeploy. |
| `Can't reach database` | Wrong `DATABASE_URL`, firewall, or SSL | Use provider connection string with `sslmode=require`. |
| 500 on all API routes | Migrations not applied | Run `npx prisma migrate deploy`. |
| Magic link never arrives | SMTP not implemented / not configured | Use password sign-up or add email sending. |
| App sleeps / slow first request | Free tier idle (e.g. Fly `min_machines_running = 0`) | Set `min_machines_running = 1` in `fly.toml` or use a paid plan. |

---

## Suggested path for most people

1. **Fastest path to a public URL:** Fly.io or Railway + managed Postgres.  
2. **Custom domain:** Add DNS + update `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`.  
3. **Real users:** Enable email/password first; add SMTP or Google when ready.  
4. **Run migrations** on every production database before calling it “live”.

For local development only, see [README.md](README.md).
