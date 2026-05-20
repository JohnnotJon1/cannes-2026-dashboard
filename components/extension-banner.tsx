"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Wand2, X, Download } from "lucide-react";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";

// Dismissible install CTA shown on the dashboard for Chrome users who
// haven't installed the companion extension yet.
//
// Detection layers:
//   1. The extension's dashboard-bridge.js sets a `data-ccc-extension`
//      attribute on <html> when it runs. We observe that attribute via
//      useSyncExternalStore + MutationObserver — if present, hide.
//   2. We only show on Chromium-family browsers (the only ones the
//      extension supports at launch).

function subscribeExtensionAttr(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-ccc-extension"],
  });
  return () => observer.disconnect();
}

function readExtensionInstalled() {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.getAttribute("data-ccc-extension") === "installed"
  );
}

export function ExtensionBanner() {
  const [dismissed, setDismissed, hydrated] = useLocalStorage<boolean>(
    STORAGE_KEYS.extensionBannerDismissed,
    false
  );
  const installed = useSyncExternalStore(
    subscribeExtensionAttr,
    readExtensionInstalled,
    () => false
  );

  // Early returns keep the navigator/UA check off the SSR path entirely.
  if (!hydrated || dismissed || installed) return null;

  const ua =
    typeof navigator !== "undefined" ? navigator.userAgent ?? "" : "";
  const isChromium =
    /Chrome|Chromium|Edg|Brave/i.test(ua) && !/Firefox/i.test(ua);
  if (!isChromium) return null;

  return (
    <div className="relative rounded-2xl border border-[color:var(--hairline)] bg-white px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand-100 text-teal-800">
          <Wand2 className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold leading-tight text-teal-900">
            Auto-fill every Cannes RSVP form, free.
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[color:var(--ink-soft)]">
            Install the companion Chrome extension and your name, email,
            company, and title pre-populate on every event form. No accounts,
            no cost.{" "}
            <Link
              href="/extension"
              className="font-medium text-teal-700 underline-offset-2 hover:underline"
            >
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/extension"
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-800 px-3.5 py-1.5 text-[13px] font-semibold text-teal-800 transition-colors hover:bg-teal-800 hover:text-sand-50"
          >
            <Download className="h-3.5 w-3.5" />
            Install extension
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss extension banner"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--muted)] hover:bg-sand-100 hover:text-teal-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
