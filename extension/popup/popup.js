// Popup logic. Asks the service worker for the cached profile and
// renders either a "not connected" state or the "connected" state with
// a preview of the saved fields.

// The "Open dashboard" link from the popup points at the production URL.
// We can't reliably probe localhost:3100 from a popup before opening it,
// so we just default to prod. Developers can replace this in the source.
const DASHBOARD_URL = "https://cannes-2026-dashboard.vercel.app";

async function pickDashboardUrl() {
  return DASHBOARD_URL;
}

function formatRelative(ms) {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ms).toLocaleDateString();
}

function show(id) {
  for (const el of document.querySelectorAll("section")) el.hidden = true;
  const target = document.getElementById(id);
  if (target) target.hidden = false;
}

async function init() {
  const dashboard = await pickDashboardUrl();
  document.getElementById("open-dashboard-cta").href = dashboard;
  document.getElementById("open-dashboard-edit").href = `${dashboard}/profile`;

  chrome.runtime.sendMessage({ type: "ccc:get-profile" }, (resp) => {
    const profile = resp?.profile;
    const syncedAt = resp?.syncedAt;
    if (!profile || (!profile.name && !profile.email)) {
      show("state-not-connected");
      return;
    }
    document.getElementById("connected-name").textContent =
      profile.name || "Connected";
    document.getElementById("connected-email").textContent =
      profile.email || "";
    document.getElementById("synced-at").textContent = syncedAt
      ? `Last sync: ${formatRelative(syncedAt)}`
      : "";
    document.getElementById("f-name").textContent = profile.name || "—";
    document.getElementById("f-email").textContent = profile.email || "—";
    document.getElementById("f-company").textContent = profile.company || "—";
    document.getElementById("f-title").textContent = profile.title || "—";
    show("state-connected");
  });
}

init();
