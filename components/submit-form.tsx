"use client";

import { useState, FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type YearSignal = "going-this-year" | "attended-last-year";

interface FormState {
  name: string;
  company: string;
  role: string;
  linkedinUrl: string;
  twitterUrl: string;
  photoUrl: string;
  yearSignal: YearSignal;
}

const EMPTY: FormState = {
  name: "",
  company: "",
  role: "",
  linkedinUrl: "",
  twitterUrl: "",
  photoUrl: "",
  yearSignal: "going-this-year",
};

export function SubmitForm() {
  const [state, setState] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setState((prev) => ({ ...prev, [k]: v }));
    if (error) setError(null);
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        person?: { id: string };
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      const id = data.person?.id ?? "";
      // Redirect to /people anchored on the new card.
      router.push(`/people?just-added=${encodeURIComponent(id)}`);
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border border-[color:var(--hairline)] bg-white p-5 sm:grid-cols-2"
      onSubmit={onSubmit}
    >
      <Field label="Full name *" full>
        <input
          type="text"
          required
          value={state.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
          maxLength={60}
        />
      </Field>
      <Field label="Company *">
        <input
          type="text"
          required
          value={state.company}
          onChange={(e) => update("company", e.target.value)}
          placeholder="Your Company"
          autoComplete="organization"
          maxLength={80}
        />
      </Field>
      <Field label="Role / title">
        <input
          type="text"
          value={state.role}
          onChange={(e) => update("role", e.target.value)}
          placeholder="CMO / Founder / Head of Brand"
          autoComplete="organization-title"
          maxLength={80}
        />
      </Field>
      <Field label="LinkedIn URL">
        <input
          type="url"
          value={state.linkedinUrl}
          onChange={(e) => update("linkedinUrl", e.target.value)}
          placeholder="https://linkedin.com/in/your-slug"
        />
      </Field>
      <Field label="X / Twitter URL">
        <input
          type="url"
          value={state.twitterUrl}
          onChange={(e) => update("twitterUrl", e.target.value)}
          placeholder="https://x.com/your-handle"
        />
      </Field>
      <Field label="Photo URL (paste from LinkedIn or X)" full>
        <input
          type="url"
          value={state.photoUrl}
          onChange={(e) => update("photoUrl", e.target.value)}
          placeholder="https://…/your-headshot.jpg"
        />
      </Field>
      <Field label="When are you going?" full>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: "going-this-year", label: "Going to Cannes 2026" },
              { v: "attended-last-year", label: "Went last year (Cannes 2025)" },
            ] as const
          ).map((opt) => {
            const active = state.yearSignal === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => update("yearSignal", opt.v)}
                className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
                  active
                    ? "border-teal-700 bg-teal-700 text-sand-50"
                    : "border-[color:var(--hairline)] bg-white text-[color:var(--ink-soft)] hover:bg-sand-100"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>

      {error && (
        <div className="sm:col-span-2 rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-[13px] text-coral-700">
          {error}
        </div>
      )}

      <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-2">
        <p className="text-[12px] text-[color:var(--muted)]">
          By submitting, you agree to be listed on the public attendees page. We
          do not send anything to your email or LinkedIn.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2 text-[14px] font-semibold text-sand-50 hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Adding…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Add me to the list
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
