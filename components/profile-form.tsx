"use client";

import { useEffect, useState } from "react";
import { Lock, Check, Trash2 } from "lucide-react";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";
import { EMPTY_PROFILE, type UserProfile } from "@/types";

// One-time migrations for older localStorage shapes:
//  1. An earlier build masked sensitive fields with the bullet character (•)
//     for display. Typing into a masked input wrote those bullets into
//     storage, corrupting the saved value. Strip any field that is entirely
//     bullets so the user can re-enter it cleanly.
//  2. A previous schema had `bio` and `dietary` fields on UserProfile.
//     Those are gone now. When registering event RSVPs, we default to
//     `N/A` and "No food preferences" automatically. Drop any leftover
//     values from old browsers.
type LegacyProfile = UserProfile & { bio?: unknown; dietary?: unknown };

function cleanCorruptedProfile(p: UserProfile): UserProfile {
  const onlyBullets = (v?: string) => !!v && /^•+$/.test(v);
  const legacy = p as LegacyProfile;
  const hasLegacyKeys = "bio" in legacy || "dietary" in legacy;
  const hasBullets =
    onlyBullets(p.name) || onlyBullets(p.email) || onlyBullets(p.phone);
  if (!hasBullets && !hasLegacyKeys) return p;
  const next: UserProfile = {
    name: onlyBullets(p.name) ? "" : p.name,
    email: onlyBullets(p.email) ? "" : p.email,
    company: p.company,
    title: p.title,
    linkedinUrl: p.linkedinUrl,
    phone: onlyBullets(p.phone) ? "" : p.phone,
    updatedAt: p.updatedAt,
  };
  return next;
}

export function ProfileForm() {
  const [profile, setProfile, hydrated] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    EMPTY_PROFILE
  );
  const [savedTick, setSavedTick] = useState(false);

  // Run the bullet-cleanup once profile has hydrated from localStorage.
  useEffect(() => {
    if (!hydrated) return;
    const cleaned = cleanCorruptedProfile(profile);
    if (cleaned !== profile) {
      setProfile({ ...cleaned, updatedAt: new Date().toISOString() });
    }
    // We intentionally run this only once on hydration. Subsequent writes
    // can't reintroduce bullets, the masking UI is gone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!savedTick) return;
    const t = setTimeout(() => setSavedTick(false), 1600);
    return () => clearTimeout(t);
  }, [savedTick]);

  // Updater form avoids stale-closure drops when typing fast across renders.
  const update = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => {
    setProfile((prev) => ({
      ...prev,
      [k]: v,
      updatedAt: new Date().toISOString(),
    }));
    setSavedTick(true);
  };

  const clear = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear all profile fields? This cannot be undone.")
    )
      return;
    setProfile({ ...EMPTY_PROFILE, updatedAt: new Date().toISOString() });
  };

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/60 p-6 text-[13px] text-[color:var(--muted)]">
        Loading your local profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-700/30 bg-teal-100 px-4 py-3 text-[13px] text-teal-900">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>
            <strong>Stored in this browser only.</strong> Nothing on this page is sent to a server.
          </span>
        </div>
        {savedTick && (
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-teal-700">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-[color:var(--hairline)] bg-white p-5 sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Field label="Full name">
          <input
            type="text"
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            value={profile.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@yourcompany.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Company">
          <input
            type="text"
            value={profile.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Your Company"
            autoComplete="organization"
          />
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={profile.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="CMO / Founder / Head of Brand"
            autoComplete="organization-title"
          />
        </Field>
        <Field label="LinkedIn URL">
          <input
            type="url"
            value={profile.linkedinUrl ?? ""}
            onChange={(e) => update("linkedinUrl", e.target.value)}
            placeholder="https://linkedin.com/in/…"
          />
        </Field>
        <Field label="Phone (optional)">
          <input
            type="tel"
            value={profile.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 415 …"
            autoComplete="tel"
          />
        </Field>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[color:var(--muted)]">
        <div>
          {profile.updatedAt ? (
            <>Last saved {new Date(profile.updatedAt).toLocaleString()}</>
          ) : (
            <>Not saved yet. Start typing to autosave.</>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-1 text-[12px] font-medium text-coral-600 hover:bg-sand-100"
        >
          <Trash2 className="h-3 w-3" />
          Clear all fields
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
