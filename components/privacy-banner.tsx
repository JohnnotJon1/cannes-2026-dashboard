"use client";

import { Lock, X } from "lucide-react";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";

export function PrivacyBanner() {
  const [dismissed, setDismissed, hydrated] = useLocalStorage<boolean>(
    STORAGE_KEYS.privacyBannerDismissed,
    false
  );

  // Avoid flash before hydration.
  if (!hydrated || dismissed) return null;

  return (
    <div className="border-b border-[color:var(--hairline)] bg-teal-900 text-sand-100">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-2.5 text-[13px] lg:px-8">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-700">
          <Lock className="h-3 w-3" />
        </span>
        <p className="flex-1 leading-snug">
          <strong className="font-semibold text-white">Local-first by design.</strong>{" "}
          Your profile, statuses, and notes are stored in this browser only.
          They&apos;re never sent to us or to a server.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sand-100/80 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss privacy banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
