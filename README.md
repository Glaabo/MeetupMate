# MeetupMate

Find days that work for everyone. Each person marks the days they're free (or could make work) per group, and the shared calendar instantly highlights the days where the whole group — or a configurable minimum — can meet.

**Availability is end-to-end encrypted: not even the person hosting the server can see who is free when.**

Designed around a calm cream + forest-green palette (`#FAF5EE` / `#1D503A`) with a consistent hand-drawn pictogram set and atmospheric nature photography on the landing, sign-in, and invite pages.

Mobile-first, privacy-focused, and fully self-hostable. **License: MIT** (commercial use allowed, see [Licensing](#licensing--commercial-use)).

## Features

- **End-to-end encrypted availability** — group keys are generated in the browser and shared only via the invite link's `#fragment` (never sent to any server). Marked days are encrypted on-device with AES-256-GCM; the server stores opaque blobs and matching is computed client-side.
- **Email + password accounts** — only a display name, email and password hash are stored.
- **Groups** — create as many as you like (football crew, book club, family…), each with its own shared calendar, pictogram, and encryption key.
- **Invite links** — high-entropy links that expire after 7 days; only the hash is stored server-side, and the group key rides along in the URL fragment.
- **Three-state availability** — *Free*, *Maybe*, or *Busy* per day, per group.
- **Automatic matching** — days where everyone (or at least *N* people, configurable per group) is free light up, plus an "Upcoming matches" list and a "next match" preview on the dashboard — all computed on-device.
- **Ownership handover** — if an owner leaves or deletes their account, the longest-standing member takes over the group.
- **Google / Apple Calendar sync (opt-in trade-off)** — a personal iCal feed for Google Calendar ("From URL") / Apple Calendar ("Calendar Subscription"). Because the server can't read availability, your device publishes the *computed match days* (group name + date only) when sync is explicitly enabled; disabling it erases them immediately.
- **Privacy controls** — one-click JSON data export and full account deletion; leaving a group erases your encrypted blob there.
- **PWA** — installable via "Add to Home Screen" on iOS/Android for an app-like experience.

## Stack

| Layer | Choice | License |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript | MIT |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) | MIT |
| Auth | [Better Auth](https://better-auth.com) | MIT |
| Database | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team) | MIT / Apache-2.0 |

SQLite keeps hosting trivial (one process, one file, easy backups) and is more than enough for friend-group scale. If the app ever needs to scale to many thousands of users, Drizzle makes a move to PostgreSQL a contained change (swap the driver, regenerate migrations).

## Local development

Requires Node.js 22+.

```bash
cp .env.example .env        # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
npm install
npm run db:migrate          # creates ./data/meetupmate.db
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database is a plain file at `./data/meetupmate.db`.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Session signing secret. Generate: `openssl rand -base64 32` |
| `APP_URL` | Yes | Public URL of the app (used for auth and invite links) |
| `DATABASE_PATH` | No | SQLite file path. Default `./data/meetupmate.db` (`/data/meetupmate.db` in Docker) |

## Hosting: local-only or a server?

A shared calendar needs **one small server** — a purely local/on-device app can't merge availability from several phones without some sync layer, and peer-to-peer sync is far more complex and fragile than this app warrants. The good news: because everything runs in a single process with an embedded database, the server can be tiny and cheap (or free):

1. **A small VPS (recommended for privacy)** — e.g. Hetzner, Netcup, DigitalOcean (~3–5 €/month). `docker compose up -d` behind [Caddy](https://caddyserver.com) for automatic HTTPS. You control the data completely; pick an EU region for GDPR-friendly processing if your friends are in Europe.
2. **Fly.io** — deploy the Dockerfile with a 1 GB volume mounted at `/data`. Small apps fit the cheapest tier.
3. **A home server / Raspberry Pi** — works fine at this scale; expose it via a Cloudflare Tunnel or Tailscale Funnel so you don't open ports.
4. **Vercel/Netlify** — *not* a good fit for this build, since SQLite needs a persistent disk. If you prefer serverless hosting, switch the Drizzle driver to a managed Postgres (Neon, Supabase) first.

Whichever you choose: **always serve over HTTPS** (session cookies depend on it) and back up the single `meetupmate.db` file regularly (`sqlite3 meetupmate.db ".backup backup.db"`).

### Docker

```bash
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" > .env
echo "APP_URL=https://your-domain.example" >> .env
docker compose up -d
```

Data persists in the `meetupmate-data` volume; migrations run automatically on boot.

## Privacy

Privacy is a design constraint, not an afterthought:

- **The host can't read availability.** Each group has an AES-256-GCM key generated in the browser. It is stored in `localStorage` and shared with friends exclusively through the invite URL's `#fragment` — a part of the URL browsers never transmit to servers. The server (and therefore the host, or anyone who steals the database) only ever sees ciphertext.
- **Key verification without key knowledge**: each group stores an encrypted sentinel so clients can verify a manually entered key; the server can't derive the key from it.
- **Key responsibility**: if every member loses the group key, those marked days are gone — by design. Members can back the key up from the group settings.
- **What the server does see** (be honest about metadata): emails, display names, group names, who belongs to which group, blob update timestamps — and match days *only* for users who explicitly enable calendar sync.
- **Minimal data, no tracking**: no analytics, no third-party requests at runtime (fonts self-hosted at build time), no IP addresses stored with sessions.
- **Hashed tokens**: invite links and calendar feed URLs are stored only as SHA-256 hashes.
- **User control**: JSON export and irreversible account deletion built into Settings. Leaving a group deletes your encrypted blob; disabling calendar sync deletes all published match days.

If you operate this for others in the EU, you're a data controller under GDPR for the account data (emails, names): host in the EU, adapt the in-app [/privacy](src/app/privacy/page.tsx) page with your contact details, and answer export/deletion requests — both of which the app already automates. The availability content itself is encrypted and outside your reach.

## Licensing & commercial use

- The application code is **MIT-licensed** ([LICENSE](LICENSE)) — you may commercialize it freely.
- All runtime dependencies are MIT/Apache-2.0/ISC (permissive, commercial-friendly).
- If you add dependencies later, avoid (A)GPL-licensed packages on the server if you plan a closed-source hosted product.

## Calendar sync notes

The built-in sync uses the open **iCalendar standard** (one secret feed URL per user, served by the app itself). This works with Google Calendar, Apple Calendar, Outlook, Thunderbird, etc., requires no API keys, and shares no data with Google or Apple beyond the feed the user explicitly subscribes to.

Because availability is end-to-end encrypted, the server cannot compute the feed itself. Enabling sync makes the user's own device publish its locally computed **match days** (group name + date — never individual availability) to the server. This trade-off is explained in the UI, is off by default, and disabling sync erases the published days. Two caveats: open a group occasionally so your device can refresh the feed, and subscribed calendars refresh on the provider's schedule (Google: every ~6–24 h; Apple: configurable, down to every 5 min).

## Ideas for later

- Time-of-day slots (evening/afternoon) instead of full days only
- "Confirm a date" — pin a match day as the planned meetup and notify the group
- Optional email/push notification when a new match appears
- Recurring availability patterns ("every Friday")
- Two-way Google Calendar integration (auto-import busy days)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a new migration after schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Browse the database with Drizzle Studio |
