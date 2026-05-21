"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, Send } from "lucide-react";

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      setSucceeded(true);
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  if (succeeded) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
          <div className="space-y-1.5">
            <p className="font-display text-lg font-semibold text-teal-900">
              Got it.
            </p>
            <p className="text-[14px] leading-relaxed text-[color:var(--ink-soft)]">
              John usually replies within a day. If it&apos;s urgent and you
              left an email, mention &quot;urgent&quot; in the subject so he
              spots it faster.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-[color:var(--hairline)] bg-white p-5"
      onSubmit={onSubmit}
    >
      <div>
        <label className="field-label" htmlFor="contact-email">
          Your email (optional, so John can reply)
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="jane@yourcompany.com"
          autoComplete="email"
          maxLength={200}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="contact-message">
          Message *
        </label>
        <textarea
          id="contact-message"
          required
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError(null);
          }}
          placeholder="What's going on? Need to be removed, see a typo, want to flag something — anything goes."
          rows={6}
          maxLength={2000}
          className="block w-full"
        />
        <p className="mt-1 text-right text-[11px] text-[color:var(--muted)]">
          {message.length} / 2000
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-coral-200 bg-coral-50 px-3 py-2 text-[13px] text-coral-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[12px] text-[color:var(--muted)]">
          Sent privately to John. Not posted publicly.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-teal-900 px-6 py-2.5 text-[14px] font-semibold text-sand-50 shadow-md shadow-teal-900/15 transition hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send message
            </>
          )}
        </button>
      </div>
    </form>
  );
}
