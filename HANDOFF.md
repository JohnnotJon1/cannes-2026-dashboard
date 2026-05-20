# Cannes Command Center — Session Handoff

Previous Claude Code session (`majestic-ember`, session id `379bf04b...`) crashed in a Claude Code image-error loop on 2026-05-20 ~13:42. Code is safe — all changes committed. Use this doc to pick up in a fresh session.

## Cause of the crash (so it doesn't repeat)

A screenshot pasted into the chat exceeded 2000px on at least one dimension. Claude's API rejects images >2000px in many-image conversations. Once that image was in conversation context, every subsequent turn hit the same error and Claude auto-retried into a loop. Known Claude Code regression — see `claude-code#60221` / `#60334`.

**To prevent**: resize screenshots before pasting (≤2000px on the long edge), or paste fewer images per turn.

## Where we are

- **Repo**: `/Users/JohnG_1/Desktop/Claude-Work/cannes-command-center` — Next.js app
- **Branch**: `main`, clean working tree
- **Latest commit**: `5f7df8d docs: fix LAUNCH_STORE_LISTING after CWS keyword-spam rejection`
- **Production**: https://cannes.airpost.ai
- **Chrome extension**: v0.2.0 built (`cannes-rsvp-extension-v0.2.0.zip`)

## What shipped (last 11 commits)

```
5f7df8d docs: fix LAUNCH_STORE_LISTING after CWS keyword-spam rejection
4b6cd39 feat: photos on event + person cards
183c04f feat: strip Add Event, profile reassurance block, Integrations tab
96d6082 fix: swap install-button icon — Check → Download
5611bf9 fix: tone down extension-install banner
b474836 feat: trim chrome — drop done step + redundant labels
175a112 feat: profile page tweaks — required-for-auto-fill badge + optional LinkedIn
c7d1112 feat: production URL at cannes.airpost.ai, extension v0.2.0
e2e2478 feat: privacy page, extension v0.2.0 prep, real-people scrape, URL validation
4ff530f feat: Cannes Command Center MVP
c2ffbbf Initial commit from Create Next App
```

## What was in flight when it broke

1. **Chrome Web Store re-submission** — CWS rejected v0.2.0 for keyword spam in description. `LAUNCH_STORE_LISTING.md` was rewritten and committed. Next step John was about to do: paste the updated "Detailed description" into the CWS dev console at https://chrome.google.com/u/2/webstore/devconsole/ → Cannes 2026 RSVP Auto-Fill → Store listing.

2. **Add events from a Google Sheet** — John's last unfinished ask: "Add any events you see here to the Cannes Events https://docs.google.com/spreadsheets/u/0/d/1u0mcWgEo5EjjhMGTbq987UZm4wxMzdMSsYx9f3Cfnf4/htmlview#gid=0" — never executed because of the image loop.

3. **Site-header tweak** — Earlier in the session Claude was editing `components/site-header.tsx` to remove a "little orange thing" John spotted on every page. May be partially done — verify in browser.

4. **Jake Fleshner spot-check** — John questioned the source of Jake Fleshner's Cannes attendance. Claude confirmed: scraped from his X account on 2026-05-18 via apidojo/tweet-scraper. Entry is in `data/people.json` as `x-jake-fleshner`. No action needed unless John wants to remove it.

## How to resume

Open a fresh Claude Code session in this directory and paste this as the first message:

> I'm resuming the Cannes Command Center MVP after a Claude Code image-error crash. Read `HANDOFF.md` in this directory for full context. Next priorities (in order):
> 1. Confirm CWS rejection fix is done — diff `LAUNCH_STORE_LISTING.md` vs what's live in the Chrome Web Store dev console. If not yet pasted, walk me through it.
> 2. Pull events from this Google Sheet and add them to `data/events.json` (or wherever events live): https://docs.google.com/spreadsheets/u/0/d/1u0mcWgEo5EjjhMGTbq987UZm4wxMzdMSsYx9f3Cfnf4/htmlview#gid=0
> 3. Verify the "little orange thing on every page" is removed (check `components/site-header.tsx` and run `npm run dev`).
>
> Use gstack workflow (`/qa`, `/ship`) for verification and shipping. Don't ask questions unless blocked.
