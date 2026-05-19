"use client";

import { RefreshCw } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/storage";

// Resets the onboarding-completed flag in localStorage and reloads so the
// overlay reappears. Kept as its own client component so the Integrations
// page can stay a Server Component.

export function RestartSetupButton() {
  const restart = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEYS.onboardingCompleted);
    } catch {
      // ignore: private mode, etc.
    }
    window.location.assign("/");
  };
  return (
    <button
      type="button"
      onClick={restart}
      className="inline-flex items-center gap-1.5 rounded-full border border-teal-700/40 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-teal-800 transition-colors hover:border-teal-700 hover:bg-sand-100"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Re-run welcome setup
    </button>
  );
}
