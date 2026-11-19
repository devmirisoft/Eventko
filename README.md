# Event Manager (demo)

Minimal Next.js 16 + MongoDB demo: members, approvals, role hierarchy, payments, events.

> Demo only: passwords are stored as plain text and the session cookie is the raw member id.

## Setup

1. `.env` in the project root:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster/event_soft
   ADMIN=<admin login, typed in the phone field>
   PASSWORD=<admin password>
   ```
   (`MONGO_URI` works too.) The seed creates the admin from `ADMIN` / `PASSWORD`.
2. Install: `bun install`
3. Seed: `bun run seed`. **This wipes** the `roles`, `members`, `events`, `meetings` and `legacies` collections, then loads demo data.
4. Run: `bun dev`, then open http://localhost:3000

`npm run seed` / `npm run dev` also work, but the seed script needs [bun](https://bun.sh) installed because it runs TypeScript directly.

## Logins

- Admin: `ADMIN` / `PASSWORD` from `.env`
- Members: `9000000001` … `9000000010` / `pass123` (some are still pending approval)

`bun run check` runs a small self-check of the member-code and hierarchy-loop logic.
