"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// SSR-safe localStorage hook with versioned keys.
//
// Privacy note: every key written here stays in the user's browser.
// Nothing in this file touches the network. If you find yourself
// adding a fetch/post in this module, stop. That breaks the
// privacy promise on the landing page.

export const STORAGE_NAMESPACE = "ccc:v1";

export const STORAGE_KEYS = {
  profile: `${STORAGE_NAMESPACE}:profile`,
  statuses: `${STORAGE_NAMESPACE}:statuses`,
  customEvents: `${STORAGE_NAMESPACE}:customEvents`,
  notes: `${STORAGE_NAMESPACE}:notes`,
  privacyBannerDismissed: `${STORAGE_NAMESPACE}:privacy-banner-dismissed`,
  onboardingCompleted: `${STORAGE_NAMESPACE}:onboarding-completed`,
  extensionBannerDismissed: `${STORAGE_NAMESPACE}:extension-banner-dismissed`,
  peopleViewMode: `${STORAGE_NAMESPACE}:people-view-mode`,
  // Receipts from /submit. Each entry is the proof-of-submission a user
  // needs to remove themselves later. Never sent anywhere except as the
  // ?token=... param on DELETE /api/submit/[id].
  submittedReceipts: `${STORAGE_NAMESPACE}:submittedReceipts`,
} as const;

export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const k = "__ccc_test__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function readRaw<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeRaw<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // swallow quota / privacy mode errors silently. UI handles via banner.
  }
}

export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const initialRef = useRef(initial);

  // Hydrate from storage after mount (SSR-safe).
  useEffect(() => {
    setValue(readRaw<T>(key, initialRef.current));
    setHydrated(true);
  }, [key]);

  // Sync across tabs/windows.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      setValue(readRaw<T>(key, initialRef.current));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function"
            ? (next as (p: T) => T)(prev)
            : next;
        writeRaw(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, update, hydrated];
}
