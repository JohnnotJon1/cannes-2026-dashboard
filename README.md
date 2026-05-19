# Cannes Lions 2026 Dashboard

A privacy-first dashboard for **Cannes Lions 2026**: beach clubs, parties, panels, yacht
dinners, and the 1,100+ fringe events on the Croisette. Pre-fills every RSVP form with your
saved info. Tracks what you got into. Surfaces who else is going. Built so the site owner
can't see your data.

> **Festival:** 22 to 26 June 2026, Cannes, France

---

## What it does

- 📅 **Event dashboard.** 30+ curated public events (open beaches, invite-only platforms, press dinners, yacht charters).
- 🪄 **Register me.** Per-event button that opens the RSVP form in a new tab with your name, email, company, and title already filled in. Click-to-copy chips for anything not covered by URL prefill. You submit the form yourself.
- 🧩 **Chrome extension companion (optional).** Install once and every Cannes RSVP form auto-fills the moment it loads, no copy-pasting. Free, zero account, zero ongoing cost. Source in [`extension/`](./extension/).
- ✅ **Status tracking.** Registered, pending, action-needed, not-registered, attended, skipped.
- ➕ **Add your own events.** Dinners, custom meetings, anything from the Propeller list.
- 👥 **Who's going.** Endless-scroll feed of people publicly confirmed for Cannes 2026 — speakers, jury presidents, brand CMOs, agency creative leaders. Real names, real LinkedIn links. Refreshable via `npm run scrape-people`. See [`scripts/scrape-cannes-signals.mjs`](./scripts/scrape-cannes-signals.mjs).
- 🪪 **Reusable profile.** Fill once. Powers every Register me click.
- 📖 **How-it-works page.** Non-technical orientation.

---

## Privacy model

Two clean tiers:

| Tier | Where it lives | Examples |
|---|---|---|
| **Public** | shipped in repo (`/data/*.json`) | event directory, sample people timeline |
| **Private** | your browser's `localStorage` only | your profile, statuses, custom events, notes |

Versioned keys: `ccc:v1:profile`, `ccc:v1:statuses`, `ccc:v1:customEvents`, `ccc:v1:privacy-banner-dismissed`, `ccc:v1:onboarding-completed`.

There is **no backend, no database, no auth, no OAuth, no analytics**. No `next-auth`, no Google Cloud setup, no env vars. The site owner can't see your data because there's no place for it to land.

Open DevTools → Application → Local Storage and you'll see everything personal sitting right there in plain JSON. Clear it and you reset cleanly.

---

## How "Register me" works

Pattern A (smart-assist), in 4 steps:

1. You click **Register me** on any event card.
2. A new tab opens to that event's registration URL with `?firstname=…&lastname=…&email=…&company=…&jobtitle=…` appended. Forms built on HubSpot, Eventbrite, Mailchimp, Cvent and similar read those params and pre-fill themselves. Forms that don't recognize the params just ignore them.
3. You glance at the form, fill any missing fields, solve any captcha, click **Submit**. You're the one who actually submits it.
4. Back in our tab, an inline assist panel asks **"How did it go?"** — click **I'm in** for green checkmark, **Waitlisted** for pending, **Needs more steps** for action-needed.

For forms that didn't fully pre-fill, the assist panel has click-to-copy chips for each profile field — flip back to the form tab and paste with one click each.

**No automation, no captcha-solving, no TOS issues, no per-user cost regardless of how many people use this app.** The magic isn't "we submitted it for you" — it's "you never have to retype your name, email, company and title 30 times."

---

## Run locally

Requires **Node 20+** and `npm`.

```bash
git clone <this-repo> cannes-2026-dashboard
cd cannes-2026-dashboard
npm install
npm run dev
```

Open <http://localhost:3000>.

**Zero environment variables required.** Ever.

### Common scripts

```bash
npm run dev        # dev server (Turbopack)
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npx tsc --noEmit   # type check
```

---

## Deploy to Vercel (3 minutes, no env vars)

```bash
gh repo create cannes-2026-dashboard --public --source=. --remote=origin --push
```

Then visit <https://vercel.com/new>, import the repo, click **Deploy**. Done. URL looks like `https://cannes-2026-dashboard.vercel.app`.

### Deploy elsewhere

Stock Next.js 16 app — Netlify, Cloudflare Pages, Fly, AWS Amplify all work. Fully static apart from the OG image route.

---

## Updating the seed data

The public event list is `data/events.json`. Schema is enforced by `types/index.ts` (`CannesEvent`).

To add or edit an event:

1. Open `data/events.json` and add an entry. `id` must be unique and kebab-case.
2. Add a `prefillUrl` if you know the form supports URL params. The supported placeholders are `{{firstName}}`, `{{lastName}}`, `{{name}}`, `{{email}}`, `{{company}}`, `{{title}}`, `{{linkedinUrl}}`, `{{phone}}`. Unknown params are ignored by most forms, so adding them is safe.
3. `npm run dev` hot-reloads it.
4. Bump `data/refresh.json`'s `lastUpdated` ISO so the "Updated" pill reflects reality.

Same shape applies to `data/people.json` (`PersonSignal`). Today these are real entries curated from official Cannes Lions 2026 announcements and public LinkedIn / X posts. Re-run `npm run scrape-people` (requires `APIFY_TOKEN`) to refresh the feed from the latest public signals.

### Refreshing the people feed

```bash
# One-off Apify-backed scrape. ~$1-3 spend per run.
APIFY_TOKEN=apify_api_xxx npm run scrape-people
git add data/people.json data/refresh.json
git commit -m "Refresh people feed"
```

The script (`scripts/scrape-cannes-signals.mjs`) is a single Node ES module — no build step. It pulls from **two sources**:

1. **X / Twitter** via `apidojo/tweet-scraper` (the most popular X scraper on Apify). Returns real authored tweets matching the search.
2. **LinkedIn (cookieless)** via `apify/google-search-scraper` with `site:linkedin.com/posts` queries. Hits Google's index of public LinkedIn posts — never crawls LinkedIn directly. **TOS-clean** (no LinkedIn auth, no LinkedIn rate limits). Parses Google SERP results into person names by extracting the LinkedIn URL slug.

Filters via `data/people-blocklist.json`, dedupes by profile slug + name, and **preserves curated entries** (anything in `data/people.json` whose `id` doesn't start with `g-` or `x-`).

If an actor's input schema changes, swap via env vars:

```bash
APIFY_X_ACTOR=other-username~other-x-actor \
APIFY_LINKEDIN_SERP_ACTOR=other-username~other-google-search-actor \
npm run scrape-people
```

### Takedown requests

People can ask to be removed via the [takedown issue template](./.github/ISSUE_TEMPLATE/takedown-request.yml) or by emailing the maintainer (the people page lists the contact). To process:

1. Remove the entry from `data/people.json`.
2. Add their LinkedIn / X URL to the `urls` array in `data/people-blocklist.json` so future refreshes skip them.
3. Commit + push.

---

## Roadmap (clearly future, not in MVP)

### 1. Companion Chrome extension (shipped — pending Web Store review)
- Free Chrome extension that does true client-side auto-fill on every known Cannes RSVP form.
- Reads the user's profile from the dashboard's localStorage, fills fields on event pages via per-event selectors + heuristic fallback.
- Source in [`extension/`](./extension/). See its README for install / dev / publish instructions.
- See [`/extension`](./app/extension/page.tsx) on the live dashboard for the user-facing install page.

### 2. Real public-signal ingestion of LinkedIn + X
- Single shared Apify scrape, daily cron, server-side cache.
- Cost stays flat regardless of user count (~$10/month at modest refresh frequency).
- Hard budget cap of $50/month in Apify account settings = guaranteed worst-case spend.
- Required env vars: `APIFY_TOKEN`, `MAX_MONTHLY_SPEND`.

### 3. iCal export
- One-click "download all my registered events as .ics" — no Google Calendar OAuth needed, works with any calendar app.

### 4. Multi-festival support
- Generalize the data model with `festivalId`. Same UI for SXSW, NewFronts, Adweek NYC.

### 5. Per-event prefill verification
- Once-per-event manual check that the prefill URL actually populates fields. Today's prefill is a best-effort HubSpot-style guess; some events likely ignore the params.

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

No analytics, no auth, no database, no OAuth, no cookies (beyond the privacy-banner dismiss flag).

---

## Project structure

```
.
├── app/
│   ├── layout.tsx               # shell, fonts, nav, footer, privacy banner, onboarding
│   ├── page.tsx                 # dashboard
│   ├── people/page.tsx          # who's going (endless scroll)
│   ├── profile/page.tsx         # private local-first profile
│   ├── integrations/page.tsx    # how registration works (no integrations needed)
│   ├── how-it-works/page.tsx    # non-technical orientation
│   ├── icon.tsx                 # generated favicon
│   ├── opengraph-image.tsx      # generated 1200x630 OG image
│   └── globals.css              # design tokens
├── components/
│   ├── onboarding/              # first-visit walkthrough (intro → profile → done)
│   ├── registration-assist-panel.tsx
│   └── …                        # cards, dialogs, etc.
├── data/
│   ├── events.json              # public seed events with prefill URL templates
│   ├── people.json              # 60 sample people signals
│   └── refresh.json             # "last updated" metadata
├── lib/
│   ├── storage.ts               # SSR-safe localStorage hook
│   ├── filters.ts               # filter / sort / group helpers
│   ├── registration.ts          # prefill URL builder + click-to-copy fields
│   └── seed.ts                  # JSON loaders
├── public/
│   ├── walkthrough-bg.jpg       # aerial Croisette photo (onboarding)
│   └── walkthrough/             # source variants
└── types/index.ts               # shared TypeScript types
```

---

## What's mocked vs real (today)

| Feature | Today | Future |
|---|---|---|
| Event directory | Real (curated from Cannes 2026 publicly-listed events) | + scraping pipeline |
| Register me (prefill via URL params) | Real (best-effort HubSpot-style) | + verified per-event templates |
| Status tracking | Real (localStorage) | Same — stays local |
| Profile | Real (localStorage, private) | Same — stays local |
| Add custom event | Real | + optional submit-to-public-seed |
| People timeline | 60 samples, clearly labelled | + Apify-backed public-signal ingestion |
| Auto-registration agent (actually submits forms) | No — user always submits themselves | Playwright agent with hard cost caps |

---

## Not affiliated with Cannes Lions

This dashboard is a community tool. The festival, the official Cannes Lions site, and all
sponsor activations are trademarks of their respective owners. Event details are sourced from
publicly-listed registration pages.

---

## Contributing

PRs welcome, especially to `data/events.json`. Two rules:

1. **Don't break the privacy model.** No network calls that send user data anywhere. The `lib/storage.ts` module is the single source of truth for personal state.
2. **Don't include real-person profile data in `data/people.json`** unless they've publicly opted in via a Cannes-attendance post. Sample / illustrative data is fine while the public-signal ingestion is being built.

---

## License

MIT.
