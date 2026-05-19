// Dashboard bridge.
//
// This content script runs on the Cannes 2026 dashboard's origin. Its job:
//   1. Read the saved profile from the dashboard's localStorage.
//   2. Forward it to the extension's service worker, which caches it.
//   3. Re-forward when the user updates their profile (storage event).
//
// The profile then lives in chrome.storage.local for the extension's
// content script to use when filling forms on event registration pages.
//
// Privacy: this script only reads a single, namespaced localStorage key
// (`ccc:v1:profile`). It does not touch anything else on the page.

(function () {
  const PROFILE_KEY = "ccc:v1:profile";

  function readProfile() {
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function sendSnapshot() {
    const profile = readProfile();
    if (!profile) return;
    try {
      chrome.runtime.sendMessage({
        type: "ccc:profile-snapshot",
        payload: profile,
      });
    } catch (err) {
      // Extension context may be invalidated after a reload; that's fine.
      console.debug("[ccc-ext bridge] sendMessage failed", err?.message);
    }
  }

  // Initial push on page load.
  sendSnapshot();

  // Re-push whenever the profile changes (works for cross-tab updates).
  window.addEventListener("storage", (e) => {
    if (e.key === PROFILE_KEY) sendSnapshot();
  });

  // Also re-push when the page becomes visible again, in case the user
  // edited the profile in another tab without firing a storage event in
  // this one (some browsers don't fire storage in the originating tab).
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) sendSnapshot();
  });

  // Expose a tiny signal so the dashboard knows the extension is alive.
  // (Used by the install banner to hide itself when the extension is
  // already installed.)
  try {
    document.documentElement.setAttribute("data-ccc-extension", "installed");
  } catch {
    // ignore
  }
})();
