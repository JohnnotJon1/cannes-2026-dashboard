# Cannes Command Center

A privacy-first dashboard for **Cannes Lions 2026** — beach clubs, parties, panels, yacht
dinners, and the 1,100+ fringe events on the Croisette. Track what you're registered for,
add your own meetings, see who else is going. Built so the site owner can't see your data.

> **Festival:** 22–26 June 2026, Cannes, France

---

## What it does

- 📅 **Event dashboard** — 30+ curated public events (open beaches, invite-only platforms, press dinners, yacht charters).
- ✅ **Status tracking** — registered / pending / action-needed / not-registered / attended / skipped.
- ➕ **Add your own events** — dinners, custom meetings, anything from the Propeller list.
- 👥 **Who's going** — timeline of people publicly saying they'll be on the Croisette (sample data today; real public-signal ingestion later).
- 🪪 **Reusable profile** — fill once, paste into every RSVP form.
- 🔌 **Integrations placeholder** — Gmail confirmation parsing, Google Calendar push, public LinkedIn signal — all designed to use your own accounts.
- 📖 **How-it-works page** — non-technical orientation.

---

## Privacy model

Two clean tiers:

| Tier | Where it lives | Examples |
|---|---|---|
| **Public** | shipped in repo (`/data/*.json`) | event directory, sample people timeline |
| **Private** | your browser's `localStorage` only | your profile, statuses, custom events, notes |

Versioned keys: `ccc:v1:profile`, `ccc:v1:statuses`, `ccc:v1:customEvents`, `ccc:v1:privacy-banner-dismissed`.

There is **no backend, no database, no auth, no analytics**. The site owner can't see your data because there's no place for it to land.

Open DevTools → Application → Local Storage and you'll see everything personal sitting right there in plain JSON. Clear it and you reset cleanly.

---

## Run locally

Requires **Node 20+** and `npm`.

```bash
git clone <this-repo> cannes-command-center
cd cannes-command-center
npm install
npm run dev
```

Open <http://localhost:3000>.

No environment variables required for the MVP.

### Common scripts

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npx tsc --noEmit   # type check
```

---

## Deploy to Vercel (5 minutes, no env vars)

The fastest path to a public URL:

1. Push this repo to GitHub:
   ```bash
   gh repo create cannes-command-center --public --source=. --remote=origin --push
   ```
2. Visit <https://vercel.com/new> and import the repo.
3. Click **Deploy**. (Next.js + Tailwind are auto-detected. No env vars needed.)

Your URL will be something like `https://cannes-command-center.vercel.app`. Custom domain optional via Vercel → Domains.

### Deploy elsewhere

It's a stock Next.js 16 app — anywhere that runs Next works (Netlify, Cloudflare Pages, Fly, AWS Amplify). The app is fully static apart from the OG image route (`/opengraph-image`).

---

## Updating the seed data

The public event list is `data/events.json`. Schema is enforced by `types/index.ts` (`CannesEvent`).

To add or edit events:

1. Open `data/events.json`.
2. Add an entry following the existing pattern. `id` must be unique and kebab-case.
3. `npm run dev` will hot-reload it.
4. Update `data/refresh.json` with a new `lastUpdated` ISO timestamp so the "Updated" pill reflects reality.

Same shape applies to `data/people.json` (`PersonSignal`). Today these are illustrative sample entries — clearly labelled as such in the UI.

---

## Roadmap

Already mocked / fake-doored in the UI; here's the build order to make them real.

### 1. Daily refresh cron (~1 day of work)
- Add a Vercel Cron job hitting `/api/refresh` once daily.
- The route fetches new entries from a small scraping pipeline (Apify actor or curated maintained list), updates `data/events.json`, commits via GitHub API.
- No user-facing change beyond a fresher "Updated" timestamp.

### 2. Gmail confirmation parsing (~2–3 days)
- Add NextAuth with the Google provider, scopes: `gmail.readonly`.
- Token stored in encrypted session cookie (`NEXTAUTH_SECRET` env var required, not stored in any DB the site owner controls).
- `/api/integrations/gmail/scan` route runs label-scoped queries (e.g. `from:noreply@dentsu.com after:2026-05-01`) and surfaces matches client-side. The client merges status updates into `localStorage`. Inbox content never persists server-side.
- UI: "Connect Gmail" button on `/integrations` becomes live.

### 3. Google Calendar push (~1 day after Gmail)
- Same NextAuth + Google session. Scope: `calendar.events`.
- "Add to my calendar" button on each event card calls `/api/integrations/gcal/insert` with the event payload. The route creates the event on the user's calendar via the user's own token.

### 4. Public LinkedIn / X signal feed for `/people` (~2 days)
- Backed by an Apify actor or maintained list of public posts mentioning Cannes 2026 attendance.
- Stored in `data/people.json`. **Never** scrapes private profiles or email addresses.

### 5. Optional multi-festival support (~1 week)
- Generalize the data model with a `festivalId`. Reuse the entire UI for SXSW, NewFronts, Adweek NYC.

### 6. Server-rendered share images
- Per-event OG images so individual event URLs preview nicely on LinkedIn/X.

### Required env vars when integrations land

```
NEXTAUTH_SECRET=…       # any random 32+ char string
GOOGLE_CLIENT_ID=…      # for Gmail + GCal OAuth
GOOGLE_CLIENT_SECRET=…
APIFY_TOKEN=…           # for daily refresh + people signals
```

None are required for the MVP.

---

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 4**
- **Radix UI** (Dialog primitives only)
- **lucide-react** icons
- Static seed JSON in `data/`
- Browser `localStorage` for private state
- `Fraunces` (display serif) + `Inter` (UI sans) via `next/font/google`

No analytics, no auth, no database, no cookies (beyond the privacy-banner dismiss flag).

---

## Project structure

```
.
├── app/
│   ├── layout.tsx               # shell, fonts, nav, footer, privacy banner
│   ├── page.tsx                 # dashboard
│   ├── people/page.tsx          # who's going
│   ├── profile/page.tsx         # private local-first profile
│   ├── integrations/page.tsx    # fake-door settings
│   ├── how-it-works/page.tsx    # onboarding
│   ├── icon.tsx                 # generated favicon
│   ├── opengraph-image.tsx      # generated 1200x630 OG image
│   └── globals.css              # design tokens
├── components/                  # site UI
├── data/
│   ├── events.json              # public seed events
│   ├── people.json              # sample people signals
│   └── refresh.json             # "last updated" metadata
├── lib/
│   ├── storage.ts               # SSR-safe localStorage hook
│   ├── filters.ts               # filter/sort/group helpers
│   └── seed.ts                  # JSON loaders
└── types/index.ts               # shared TypeScript types
```

---

## What's mocked vs real (today)

| Feature | Today | Future |
|---|---|---|
| Event directory | Real (curated from Cannes 2026 publicly-listed events) | + scraping pipeline |
| Status tracking | Real (localStorage) | + per-user sync via their own cloud (opt-in) |
| Profile | Real (localStorage, private) | Same — stays local |
| Add custom event | Real | + optional submit-to-public-seed |
| People timeline | Sample data (~12), clearly labelled | + Apify-backed public signal ingestion |
| Email check | Fake-door on `/integrations` | NextAuth + Gmail API on user's account |
| Calendar push | Fake-door | NextAuth + GCal API on user's account |
| Daily refresh | Static `lastUpdated` timestamp | Vercel Cron + ingestion |

---

## Not affiliated with Cannes Lions

Cannes Command Center is a community tool. The festival, the official Cannes Lions site, and all
sponsor activations are trademarks of their respective owners. Event details are sourced from
publicly-listed registration pages.

---

## Contributing

PRs welcome — especially to `data/events.json`. Two rules:

1. **Don't break the privacy model.** No network calls that send user data anywhere. The `lib/storage.ts` module is the single source of truth for personal state.
2. **Don't include real-person profile data in `data/people.json`** unless they've publicly opted in via a Cannes-attendance post. Sample/illustrative data is fine while the public-signal ingestion is being built.

---

## License

MIT.
