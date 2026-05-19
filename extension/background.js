// Service worker for the Cannes 2026 RSVP Auto-Fill extension.
//
// Responsibilities:
// - Cache the user's profile snapshot whenever the dashboard's content
//   script forwards a fresh copy.
// - Watch tab navigations. When a tab lands on a known Cannes event URL,
//   inject the content script that fills the form using the cached
//   profile + playbook.
//
// Privacy posture: never makes a network request. All data stays in
// chrome.storage.local on the user's machine.

const DASHBOARD_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3100",
  "https://cannes-2026-dashboard.vercel.app",
];

// Cached host list, hydrated lazily from playbook.json + manifest.
let cachedPlaybook = null;
async function loadPlaybook() {
  if (cachedPlaybook) return cachedPlaybook;
  const url = chrome.runtime.getURL("playbook.json");
  const res = await fetch(url);
  cachedPlaybook = await res.json();
  return cachedPlaybook;
}

function hostMatches(targetUrl) {
  try {
    const u = new URL(targetUrl);
    const manifest = chrome.runtime.getManifest();
    const hosts = manifest.host_permissions ?? [];
    return hosts.some((pattern) => {
      // Strip protocol + trailing /*  → "example.com"
      const m = pattern.match(/^https?:\/\/([^/]+)/);
      if (!m) return false;
      const host = m[1].replace(/^\*\./, "");
      if (DASHBOARD_ORIGINS.some((origin) => origin.includes(host))) return false;
      return u.hostname === host || u.hostname.endsWith("." + host);
    });
  } catch {
    return false;
  }
}

// Receive profile snapshots from the dashboard bridge.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;

  // Origin-lock: only accept profile snapshots from a known dashboard origin.
  if (msg.type === "ccc:profile-snapshot") {
    const senderOrigin = sender?.origin ?? sender?.url ?? "";
    const ok = DASHBOARD_ORIGINS.some((o) => senderOrigin.startsWith(o));
    if (!ok) {
      console.warn("[ccc-ext] rejected profile from unexpected origin", senderOrigin);
      sendResponse?.({ ok: false, reason: "origin-rejected" });
      return;
    }
    chrome.storage.local.set(
      { profile: msg.payload, syncedAt: Date.now() },
      () => sendResponse?.({ ok: true })
    );
    return true; // async sendResponse
  }

  // Popup or content script asking for the cached profile.
  if (msg.type === "ccc:get-profile") {
    chrome.storage.local.get(["profile", "syncedAt"], (data) => {
      sendResponse?.({ profile: data.profile ?? null, syncedAt: data.syncedAt ?? null });
    });
    return true;
  }
});

// On tab navigation, inject the form-filler content script when the tab
// lands on a known event URL. We do this dynamically (rather than via a
// static content_scripts entry) so that we don't have to re-list every
// event URL twice in the manifest.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== "complete") return;
  if (!tab?.url) return;
  if (!hostMatches(tab.url)) return;
  // Make sure we have a playbook ready; ok if it's empty.
  await loadPlaybook();
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-script.js"],
    });
  } catch (err) {
    // Some pages (chrome://, store, PDFs) can't be scripted; ignore.
    console.debug("[ccc-ext] inject skipped", tab.url, err?.message);
  }
});
