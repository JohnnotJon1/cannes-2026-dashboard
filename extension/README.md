# Cannes 2026 RSVP Auto-Fill — Chrome extension

Free companion extension for the [Cannes 2026 dashboard](../README.md). When a user navigates to a known Cannes Lions 2026 event registration URL, the extension auto-fills name, email, company, and title from the profile they saved in the dashboard.

The user always submits the form themselves. The extension never auto-submits, never solves captchas, never sends data anywhere.

---

## Architecture

```
Dashboard (cannes.airpost.ai or localhost:3100)
  └── localStorage["ccc:v1:profile"]
            ▲
            │ (dashboard-bridge.js reads + forwards)
            ▼
Extension service worker (background.js)
  └── chrome.storage.local["profile"]
            ▲
            │ (content-script.js queries when it loads)
            ▼
Cannes event registration page
  └── form fields filled by selectors from playbook.json
       (with heuristic fallback for unknown events)
```

The extension only fills fields. The user reviews, fills anything missing, solves any captcha, and clicks submit.

---

## File layout

| File | Purpose |
|---|---|
| `manifest.json` | Manifest V3 declaration. Lists host permissions for ~25 known event domains + the dashboard origin. |
| `background.js` | Service worker. Caches the profile snapshot from the dashboard bridge, injects the form-fill content script when a tab lands on a known event URL. |
| `dashboard-bridge.js` | Content script that runs on the dashboard's origin. Reads `localStorage["ccc:v1:profile"]` and forwards it to the service worker. Also sets `data-ccc-extension="installed"` on `<html>` so the dashboard can hide its install banner. |
| `content-script.js` | Injected on demand into event registration pages. Looks up the URL in `playbook.json`, fills fields via CSS selectors, falls back to heuristic detection (`input[type="email"]`, `input[name*="company" i]`, etc.) when no playbook entry exists. Shows a small floating badge after filling. |
| `playbook.json` | Per-event field selector map. JSON, hand-curated. Easy to extend without rebuilding the extension. |
| `popup/popup.html`, `popup.js`, `popup.css` | The toolbar popup. Shows connection state, the cached profile preview, last sync time, and a link to edit your profile. |
| `icons/` | 16, 48, 128 px PNG icons (C/26 logo). |

---

## Local development

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** on (top-right corner).
3. Click **Load unpacked** and select this `extension/` folder.
4. Open the dashboard (`http://localhost:3100` if running locally) and save a profile.
5. Navigate to any of the known Cannes registration URLs (e.g. `https://www.sportbeach.com/register`). You should see the floating "Filled by your Cannes 2026 dashboard" badge for ~4 seconds.

To debug:
- Service worker console: `chrome://extensions` → find the extension → click **service worker** under "Inspect views".
- Content script console: open DevTools on the event page. Logs are prefixed with `[ccc-ext]`.

---

## Adding a new event to the playbook

1. Open Chrome DevTools on the event's registration page.
2. Inspect the form fields to find unique selectors (`name="firstname"`, `id="email-input"`, etc.).
3. Add an entry to `playbook.json`:

```json
"https://example.com/cannes-rsvp": {
  "platform": "hubspot",
  "fields": {
    "firstName": ["input[name='firstname']"],
    "lastName":  ["input[name='lastname']"],
    "email":     ["input[type='email']"],
    "company":   ["input[name='company']"],
    "title":     ["input[name='jobtitle']"]
  }
}
```

4. Add the domain to `host_permissions` in `manifest.json` if it isn't already there.
5. Reload the extension at `chrome://extensions`.

The canonical field keys you can fill are: `firstName`, `lastName`, `fullName`, `email`, `company`, `title`, `linkedin` (or `linkedinUrl`), `phone`. Each maps to a value derived from the user's saved profile.

---

## Privacy posture

- **Reads** from one place only: `localStorage["ccc:v1:profile"]` on the dashboard's origin.
- **Writes** to one place only: `chrome.storage.local["profile"]` (the user's own machine).
- **Never** makes a network request. The service worker has no `fetch` calls except for loading the bundled `playbook.json` file.
- **Origin-locked**: the service worker rejects profile snapshots whose `sender.origin` doesn't match the dashboard's URL allowlist.
- **No analytics, no telemetry, no tracking.**

---

## Publishing to the Chrome Web Store

1. Bump the `version` field in `manifest.json`.
2. Zip the `extension/` folder (excluding `README.md` if you want to keep the listing clean — the store will still accept it included).
3. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
4. Pay the one-time $5 developer fee if you haven't already.
5. Upload the zip and fill out the listing:
   - **Name**: Cannes 2026 RSVP Auto-Fill
   - **Summary**: Auto-fills your name, email, company, and title on Cannes Lions 2026 RSVP forms.
   - **Description**: Adapt from the [dashboard's `/extension` page](../app/extension/page.tsx).
   - **Category**: Productivity
   - **Privacy policy URL**: link to your dashboard's privacy section.
6. Submit for review. Google's turnaround is typically 1–3 weeks.

---

## License

MIT. Same as the dashboard.
