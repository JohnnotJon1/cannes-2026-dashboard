# Chrome Web Store Listing — paste-ready

Submit at: https://chrome.google.com/webstore/devconsole/

---

## Single product info

**Name** (max 45 chars)
```
Cannes 2026 RSVP Auto-Fill
```

**Summary** (max 132 chars)
```
Auto-fills your name, email, company, and title on every Cannes Lions 2026 RSVP form. Privacy-first. No accounts.
```

**Category**
```
Productivity
```

**Language**
```
English (United States)
```

**Detailed description** (paste into the long-description field)

> **Revised after the 2026-05-20 keyword-spam rejection** — the WHAT IT COVERS bullet
> no longer enumerates brand names. Other sections unchanged.

```
Skip the 30 forms.

Save your profile once on the free Cannes 2026 dashboard at cannes.airpost.ai, then every Cannes Lions 2026 event RSVP page auto-fills the moment it loads — name, email, company, title, LinkedIn, phone.

You review what was filled, solve any captcha, and click submit yourself. The extension never auto-submits, never sees your data outside your browser, never makes a network request.

WHAT IT COVERS
• Pre-configured for the Cannes Lions 2026 event ecosystem — open beach activations, invite-only platform events, press dinners, panels, and yacht charters
• Heuristic fallback fills standard name, email, company, and title fields on any registration form not already in the preset playbook

PRIVACY
• All data stays in your browser's localStorage and the extension's chrome.storage.local
• No analytics, no tracking, no servers, no accounts
• The extension only reads from your cannes.airpost.ai dashboard and writes form fields on the event domains in its manifest — nothing else
• Open source under MIT: github.com/JohnnotJon1/cannes-2026-dashboard

WHY THIS EXISTS
Cannes Lions is 30 separate registration forms, each asking for the same six fields. Save your info once. Click. Done.
```

---

## Privacy practices tab

**Single purpose**
```
Auto-fills your saved profile (name, email, company, title, LinkedIn, phone) into Cannes Lions 2026 event RSVP forms so you don't have to retype the same six fields 30 times.
```

**Permission justifications**

`storage`
```
Cache the user's profile locally in chrome.storage.local so it's available to fill forms on event pages even when the dashboard tab isn't open. Never transmitted off-device.
```

`scripting`
```
Inject the field-filling content script into Cannes event registration pages listed in host_permissions. Required to set form input values.
```

**Host permission justification** (paste in the box that asks why you need site access)
```
host_permissions list 25 specific Cannes Lions 2026 event registration domains so the extension can fill RSVP forms on those pages. No <all_urls> permission is requested. The cannes.airpost.ai origin is used solely to read the user-saved profile from same-origin localStorage via a small bridge script — this is the user's own dashboard and is the only data source the extension trusts.
```

**Remote code usage:** No.

**Data usage**

| Data type | Collected? | Why |
|---|---|---|
| Personally identifiable information (name, email, address, phone, etc.) | Yes — but never transmitted | User saves their profile in localStorage on their own dashboard. Extension reads it locally to fill forms. Never leaves the user's machine. |
| Authentication information | No |  |
| Personal communications | No |  |
| Location | No |  |
| Web history | No |  |
| User activity | No |  |
| Website content | No |  |

**Data certification checkboxes** (all should be checked)
- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases
- ✅ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## Privacy policy URL

```
https://cannes.airpost.ai/privacy
```

---

## Support email

```
john@airpost.ai
```

---

## Visibility

```
Public — Listed in the Chrome Web Store
```

---

## Screenshots required

Chrome Web Store wants **1–5 screenshots** at **1280×800 px** (PNG or JPG).

We'll generate these in step 10 from the live site once cannes.airpost.ai is deployed. Suggested shots:
1. Dashboard with event grid
2. Profile page with the privacy lock badge visible
3. Who's going feed
4. An event detail dialog with "Register me" + assist panel visible

A square 128×128 store icon comes from `extension/icons/icon-128.png` (already prepared).
