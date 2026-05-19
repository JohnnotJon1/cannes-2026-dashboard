// Form-fill content script.
//
// Injected on demand by background.js when a tab lands on a known Cannes
// event URL. Reads the cached profile from chrome.storage.local, looks up
// a per-event playbook entry, and fills matching form fields. Falls back
// to heuristic detection for events without a playbook entry.
//
// Never submits the form. The user always clicks submit themselves.

(function () {
  // Don't run twice on the same page.
  if (window.__ccc_extension_run__) return;
  window.__ccc_extension_run__ = true;

  function splitName(name) {
    const t = (name || "").trim();
    if (!t) return { first: "", last: "" };
    const parts = t.split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts[0], last: parts.slice(1).join(" ") };
  }

  function setNativeValue(el, value) {
    // React + many frameworks attach onChange handlers that only fire on
    // native input events. Using the prototype setter bypasses React's
    // synthetic input tracking and then dispatching `input` + `change`
    // lets the page-side framework see the new value.
    const desc =
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value") ||
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
    if (desc && desc.set) {
      desc.set.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findField(selectors) {
    if (!selectors) return null;
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      try {
        const el = document.querySelector(sel);
        if (el && !el.disabled && el.offsetParent !== null) return el;
      } catch {
        // bad selector, skip
      }
    }
    return null;
  }

  // Heuristic field finders: try the most specific patterns first, then
  // looser ones. Returns the first matching element or null.
  function heuristicFind(kind) {
    const HEURISTICS = {
      email: [
        "input[type='email']",
        "input[name*='email' i]",
        "input[id*='email' i]",
        "input[placeholder*='email' i]",
        "input[aria-label*='email' i]",
      ],
      firstName: [
        "input[name*='first' i]",
        "input[id*='first' i]",
        "input[placeholder*='first' i]",
        "input[aria-label*='first' i]",
      ],
      lastName: [
        "input[name*='last' i]",
        "input[id*='last' i]",
        "input[placeholder*='last' i]",
        "input[aria-label*='last' i]",
      ],
      fullName: [
        "input[name='name']",
        "input[name*='fullname' i]",
        "input[name*='name' i]:not([name*='user' i]):not([name*='last' i]):not([name*='first' i])",
        "input[autocomplete='name']",
        "input[placeholder*='full name' i]",
      ],
      company: [
        "input[name*='company' i]",
        "input[name*='organization' i]",
        "input[autocomplete='organization']",
        "input[placeholder*='company' i]",
        "input[aria-label*='company' i]",
      ],
      title: [
        "input[name*='title' i]",
        "input[name*='jobtitle' i]",
        "input[name*='role' i]",
        "input[autocomplete='organization-title']",
        "input[placeholder*='title' i]",
      ],
      linkedin: [
        "input[name*='linkedin' i]",
        "input[type='url']",
        "input[placeholder*='linkedin' i]",
      ],
      phone: [
        "input[type='tel']",
        "input[name*='phone' i]",
        "input[autocomplete='tel']",
        "input[placeholder*='phone' i]",
      ],
    };
    return findField(HEURISTICS[kind]);
  }

  function fillFromMap(profile, fieldMap) {
    let filled = 0;
    for (const [key, selectorOrSelectors] of Object.entries(fieldMap)) {
      const el = findField(selectorOrSelectors);
      if (!el) continue;
      const value = valueFor(key, profile);
      if (!value) continue;
      setNativeValue(el, value);
      filled++;
    }
    return filled;
  }

  function valueFor(key, profile) {
    const { first, last } = splitName(profile.name);
    switch (key) {
      case "firstName":
        return first;
      case "lastName":
        return last;
      case "fullName":
      case "name":
        return profile.name || "";
      case "email":
        return profile.email || "";
      case "company":
        return profile.company || "";
      case "title":
        return profile.title || "";
      case "linkedin":
      case "linkedinUrl":
        return profile.linkedinUrl || "";
      case "phone":
        return profile.phone || "";
      default:
        return "";
    }
  }

  function fillHeuristic(profile) {
    let filled = 0;
    const tryFill = (kind, value) => {
      if (!value) return;
      const el = heuristicFind(kind);
      if (el && !el.value) {
        setNativeValue(el, value);
        filled++;
      }
    };
    const { first, last } = splitName(profile.name);
    tryFill("email", profile.email);
    tryFill("firstName", first);
    tryFill("lastName", last);
    if (!first || !last) tryFill("fullName", profile.name);
    tryFill("company", profile.company);
    tryFill("title", profile.title);
    tryFill("linkedin", profile.linkedinUrl);
    tryFill("phone", profile.phone);
    return filled;
  }

  function showBadge(filledCount) {
    if (!filledCount) return;
    const badge = document.createElement("div");
    badge.setAttribute("data-ccc-badge", "");
    badge.textContent = `✓ Filled ${filledCount} ${filledCount === 1 ? "field" : "fields"} from your Cannes 2026 dashboard`;
    Object.assign(badge.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: "2147483647",
      background: "#0d3d3a",
      color: "#fdfaf3",
      padding: "10px 16px",
      borderRadius: "999px",
      fontFamily:
        "system-ui, -apple-system, 'Segoe UI', sans-serif",
      fontSize: "13px",
      fontWeight: "600",
      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.4)",
      opacity: "0",
      transition: "opacity 240ms ease-out",
      pointerEvents: "none",
    });
    document.body.appendChild(badge);
    requestAnimationFrame(() => (badge.style.opacity = "1"));
    setTimeout(() => {
      badge.style.opacity = "0";
      setTimeout(() => badge.remove(), 400);
    }, 4000);
  }

  function findPlaybookEntry(playbook) {
    const here = window.location.origin + window.location.pathname;
    const lower = here.toLowerCase();
    // Exact, then prefix, then host-only.
    for (const url of Object.keys(playbook)) {
      if (url.toLowerCase() === lower) return playbook[url];
    }
    for (const url of Object.keys(playbook)) {
      if (lower.startsWith(url.toLowerCase().replace(/\*$/, ""))) {
        return playbook[url];
      }
    }
    for (const url of Object.keys(playbook)) {
      try {
        const u = new URL(url);
        if (u.hostname === window.location.hostname) return playbook[url];
      } catch {
        // ignore
      }
    }
    return null;
  }

  async function main() {
    let profile = null;
    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "ccc:get-profile" }, resolve);
      });
      profile = result?.profile ?? null;
    } catch {
      // service worker unavailable
    }
    if (!profile) {
      console.debug("[ccc-ext] no cached profile, skipping fill");
      return;
    }

    let playbook = {};
    try {
      const res = await fetch(chrome.runtime.getURL("playbook.json"));
      playbook = await res.json();
    } catch {
      // playbook unavailable, use heuristics only
    }

    const entry = findPlaybookEntry(playbook);
    let filled = 0;
    if (entry?.fields) {
      filled += fillFromMap(profile, entry.fields);
    }
    // Heuristic pass picks up anything the playbook missed.
    filled += fillHeuristic(profile);

    if (filled > 0) showBadge(filled);
  }

  // Wait a beat for SPA mounts.
  if (document.readyState === "complete") {
    setTimeout(main, 250);
  } else {
    window.addEventListener("load", () => setTimeout(main, 250));
  }
})();
