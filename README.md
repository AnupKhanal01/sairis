# SAIRIS — South Asia Industrial Risk Information System

Next.js + Firebase portal for industrial-accident situational awareness across South Asia
(Nepal primary, plus India, Bangladesh, Pakistan, Sri Lanka): a live-synced industrial site
register, historical accident database, admin-reviewed news feed, a manually-curated
government-agency feed, citizen reporting, and a misinformation-verification board.

## 1. Create the Firebase project (one-time, do this yourself)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. **Build → Firestore Database** → Create database → start in **production mode**, pick a
   region close to South Asia (e.g. `asia-south1`).
3. **Build → Authentication** → Sign-in method → enable **Email/Password**.
4. **Authentication → Users → Add user** — create the one email/password account you'll use
   to sign into `/admin`. There is no public sign-up page by design.
5. **Project settings (gear icon) → General → Your apps → Add app → Web** — copy the config
   values into `.env.local` (`NEXT_PUBLIC_FIREBASE_*`, see `.env.local.example`).
6. **Project settings → Service accounts → Generate new private key** — downloads a JSON file.
   Copy `project_id`, `client_email`, and `private_key` into `.env.local`
   (`FIREBASE_ADMIN_*`). Keep the `\n` sequences in `private_key` literal (don't turn them into
   real newlines in the `.env.local` file).
7. Pick a random string for `CRON_SECRET` in `.env.local`.
8. Deploy the security rules and indexes in this repo so the database actually enforces the
   admin-only write rules:
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <your-project-id>
   ```
   (Or paste `firestore.rules` into Firebase console → Firestore → Rules manually, and create
   the two composite indexes in `firestore.indexes.json` — Firestore will also offer to
   auto-create them the first time a query needs one, via a link in the browser console error.)

## 2. Install, seed, run

```bash
npm install
npm run seed   # pushes the industrial-site register + historical accident dataset,
                # and (optionally) registers the admin user you created in step 1.4
npm run dev
```

Open `http://localhost:3000`. Sign in at `/admin/login` with the account you created in step 4.

Re-running `npm run seed` is safe — sites/accidents are keyed by a stable slug and written with
`merge: true`, so it won't duplicate records.

## 3. What's actually live vs. admin-curated

- **Industrial sites & historical accidents** (`/gis`, `/analytics`) — admin-managed via
  `/admin/sites` and `/admin/accidents`; every visitor's browser updates instantly on save
  (Firestore `onSnapshot`), no page refresh.
- **News feed** (`/social`, left column) — genuinely automated: `/admin/news` has a "Refresh
  from GDACS" button that calls `src/app/api/ingest/gdacs/route.ts`, which pulls GDACS's public
  hazard RSS feed into a **draft queue**. An admin reviews and publishes each item — nothing
  reaches the public feed unreviewed. In production, `vercel.json` also schedules this on a cron
  (Vercel's Hobby plan limits cron frequency to once/day — the manual refresh button works
  regardless of plan). ReliefWeb ingestion is not wired up (it now requires a pre-approved
  `appname` — see `scripts/addVerifiedIncidents.ts` for how real incidents were added manually
  in the meantime).
- **Government agency feed** (`/social`, right column) — NDRRMA, Nepal Police and NEOC do not
  expose any public API or RSS feed (verified by research before building this — they publish
  via Twitter/X and Facebook only). This feed is intentionally manual: an admin reads the
  agency's real post and adds it via `/admin/social`, with a link back to the original. It is
  "real-time" in the sense that it publishes to every visitor the instant an admin adds it, not
  in the sense of an unattended pull from the agency.
- **Citizen reports & misinformation board** — public can submit; only an authenticated admin
  (checked against Firestore security rules, not just UI) can reclassify a misinfo item or
  delete a report.
- **Crowd site-status reports** (`/gis` marker popups) — any visitor can report whether a site
  looks like it's "working fine" or "having a problem." Once a site collects 50+ reports and
  over 80% say "problem," it gets a dashed-red ring on the map and shows up in
  `/admin/crowd-flags` — this is a *pending signal only*, it does not change the site's official
  status (color/marker) until an admin clicks "Confirm hazard" (→ sets status to `incident`) or
  "Revert" (false alarm). Enforced server-side: `firestore.rules` lets a public write add exactly
  one vote to one counter and only sets `crowdFlagged=true` when the 50/80% math actually holds;
  it can never be unset by a public write, only by an admin. One vote per site per browser
  (tracked in `localStorage`, not a hard guarantee against a determined bad actor, but reasonable
  for this scope).

## 4. Admin access model

Firebase Auth email/password, no public sign-up. `admins/{uid}` documents in Firestore are the
source of truth for who's an admin — checked both client-side (route guard in
`src/app/admin/(protected)/layout.tsx`) and, more importantly, in `firestore.rules` (so the gate
holds even if someone bypasses the UI). Add more admins by creating their Firebase Auth user in
the console and re-running `npm run seed` (it'll prompt for the email to register), or by adding
a document directly at `admins/{their-uid}` in the Firestore console.

## 5. Deploying

Push to a git repo and import into Vercel; add all the `.env.local` values as Vercel
environment variables (the `FIREBASE_ADMIN_PRIVATE_KEY` value pastes in fine with its literal
`\n`s). The cron jobs in `vercel.json` will start firing once deployed.
