"use client";

import { useEffect, useState } from "react";
import { Lock, Check, Trash2, Eye, EyeOff } from "lucide-react";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";
import { EMPTY_PROFILE, type UserProfile } from "@/types";

export function ProfileForm() {
  const [profile, setProfile, hydrated] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    EMPTY_PROFILE
  );
  const [savedTick, setSavedTick] = useState(false);
  const [reveal, setReveal] = useState(false);

  // Reveal sensitive fields like phone/email by default? We default to hidden.
  const tickFor = (next: UserProfile) => {
    setProfile({ ...next, updatedAt: new Date().toISOString() });
    setSavedTick(true);
  };

  useEffect(() => {
    if (!savedTick) return;
    const t = setTimeout(() => setSavedTick(false), 1600);
    return () => clearTimeout(t);
  }, [savedTick]);

  const update = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    tickFor({ ...profile, [k]: v });

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

  const masked = (v: string) =>
    !v ? "" : reveal ? v : v.replace(/./g, "•");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-700/30 bg-teal-100 px-4 py-3 text-[13px] text-teal-900">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>
            <strong>Stored in this browser only.</strong> Nothing on this page is sent to a server.
          </span>
        </div>
        <div className="flex items-center gap-2">
          {savedTick && (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-teal-700">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-teal-700/30 bg-white px-2.5 py-1 text-[12px] font-medium text-teal-800 hover:bg-sand-50"
          >
            {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {reveal ? "Hide values" : "Reveal values"}
          </button>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-[color:var(--hairline)] bg-white p-5 sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Field label="Full name">
          <input
            type="text"
            value={reveal ? profile.name : masked(profile.name)}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            value={reveal ? profile.email : masked(profile.email)}
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
            value={reveal ? (profile.phone ?? "") : masked(profile.phone ?? "")}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 415 …"
            autoComplete="tel"
          />
        </Field>
        <Field label="Bio / reason for attending" className="sm:col-span-2">
          <textarea
            value={profile.bio ?? ""}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="One paragraph you can paste into event registration forms."
          />
        </Field>
        <Field label="Dietary restrictions" className="sm:col-span-2">
          <input
            type="text"
            value={profile.dietary ?? ""}
            onChange={(e) => update("dietary", e.target.value)}
            placeholder="Pescatarian, gluten-free, none, …"
          />
        </Field>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[color:var(--muted)]">
        <div>
          {profile.updatedAt ? (
            <>Last saved {new Date(profile.updatedAt).toLocaleString()}</>
          ) : (
            <>Not saved yet — start typing to autosave.</>
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
