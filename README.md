# MeetupMate

Privacy-oriented web app to find days when friends can meet. Each person marks days they are free per group; the shared calendar shows overlap counts and highlights days that meet the group’s match rule.

**License:** MIT (see [LICENSE](LICENSE)).

## Features

- Email/password or magic-link sign-in (Better Auth)
- Optional Google OAuth when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set
- Create groups, invite via expiring links (hashed tokens stored server-side)
- Per-group availability (full days only in v1)
- Shared calendar with `available / members` counts and threshold highlighting
- Export account data (JSON) and delete account from Settings
- PWA manifest for “Add to Home Screen” on mobile

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS
- PostgreSQL, Prisma 7
- Better Auth (MIT)

## Local development

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or use `docker compose up -d` from this repo)

### Setup

```bash
cp .env.example .env
# Generate a secret: npx auth secret
# Edit .env with DATABASE_URL and BETTER_AUTH_SECRET

npm install
npm run db:migrate   # or: npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Magic links:** Without SMTP configured, magic-link URLs are printed to the server console. Set `SMTP_*` variables in `.env` to send real email.

### Database (Docker)

```bash
docker compose up -d
```

Default URL: `postgresql://meetupmate:meetupmate@localhost:5432/meetupmate`

## Environment variables

| Variable               | Required | Description                                |
| ---------------------- | -------- | ------------------------------------------ |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string               |
| `BETTER_AUTH_SECRET`   | Yes      | Session signing secret (`npx auth secret`) |
| `BETTER_AUTH_URL`      | Yes      | Public app URL for auth callbacks          |
| `NEXT_PUBLIC_APP_URL`  | Yes      | Used in invite links                       |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth                               |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth                               |
| `SMTP_*`               | No       | Magic-link email delivery                  |

## Deployment

### Docker

```bash
docker build -t meetupmate .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="https://your-domain.com" \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.com" \
  meetupmate
```

Run migrations against the production database before or on startup:

```bash
npx prisma migrate deploy
```

### Fly.io

1. Create a Fly app and Postgres (or Neon) database.
2. Set secrets: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.
3. `fly deploy` (see [fly.toml](fly.toml)).

### Railway / Vercel + managed Postgres

- **Vercel:** Deploy the Next.js app; attach Neon/Supabase for `DATABASE_URL`.
- **Railway:** Deploy from Dockerfile or Next.js buildpack; add PostgreSQL plugin.

Use HTTPS everywhere. Pick a hosting region close to your users for GDPR-friendly processing.

## Privacy

See the in-app [privacy policy](/privacy). The app does not use third-party analytics in v1. Users can export or delete their data from Settings.

## Commercial use

The application code is MIT-licensed. Dependencies used are permissive (MIT/Apache/ISC). Review licenses before adding new packages; avoid AGPL/GPL on the server if you plan a proprietary hosted service.

## API (summary)

| Method   | Path                           | Description               |
| -------- | ------------------------------ | ------------------------- |
| GET/POST | `/api/groups`                  | List / create groups      |
| GET      | `/api/groups/:id`              | Group details             |
| POST     | `/api/groups/:id/invites`      | Create invite link        |
| POST     | `/api/invites/:token/accept`   | Join group                |
| GET/PUT  | `/api/groups/:id/availability` | My availability for month |
| GET      | `/api/groups/:id/calendar`     | Aggregated calendar       |
| GET      | `/api/user/export`             | GDPR-style export         |
| DELETE   | `/api/user/delete`             | Delete account            |

Auth routes are under `/api/auth/*` (Better Auth).
