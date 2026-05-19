"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Clock3,
  AlertTriangle,
  X,
} from "lucide-react";
import type { AnyEvent, EventStatus, UserProfile } from "@/types";
import { buildRegistrationUrl, copyableFields } from "@/lib/registration";

// Inline assist panel rendered in the event detail dialog after the user
// clicks "Register me". Opens the event's prefilled URL in a new tab,
// exposes click-to-copy chips for fields not covered by the prefill, and
// captures the outcome (registered / waitlisted / needs more steps).
//
// All state lives in this component and in localStorage via the parent's
// setStatus call. Nothing is sent to a server.

export function RegistrationAssistPanel({
  event,
  profile,
  onConfirm,
  onCancel,
}: {
  event: AnyEvent;
  profile: UserProfile;
  onConfirm: (status: EventStatus) => void;
  onCancel: () => void;
}) {
  const url = buildRegistrationUrl(event, profile);
  const fields = copyableFields(profile);

  return (
    <div className="space-y-4 rounded-2xl border border-teal-700/30 bg-teal-100/40 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-800 text-sand-50">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-teal-900">
            We opened the registration page in a new tab.
          </h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            Some forms (HubSpot, Eventbrite and similar) read your info from
            the URL and prefill themselves. Most don&apos;t. Use the click-to-copy
            chips below to paste each field in one click. When the form&apos;s
            submitted (and any captcha solved), come back here to confirm.
          </p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-teal-700 underline-offset-2 hover:underline"
            >
              Re-open the form
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="rounded-xl border border-teal-700/20 bg-white/70 p-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-teal-800">
            Click any chip to copy that field
          </div>
          <div className="flex flex-wrap gap-1.5">
            {fields.map((f) => (
              <CopyChip key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-teal-700/20 pt-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
          How did it go?
        </div>
        <div className="flex flex-wrap gap-1.5">
          <OutcomeButton
            variant="primary"
            Icon={Check}
            label="I'm in"
            onClick={() => onConfirm("registered")}
          />
          <OutcomeButton
            variant="amber"
            Icon={Clock3}
            label="Waitlisted"
            onClick={() => onConfirm("pending")}
          />
          <OutcomeButton
            variant="coral"
            Icon={AlertTriangle}
            label="Needs more steps"
            onClick={() => onConfirm("action-needed")}
          />
          <OutcomeButton
            variant="ghost"
            Icon={X}
            label="Cancel"
            onClick={onCancel}
          />
        </div>
      </div>
    </div>
  );
}

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard API can fail in non-secure contexts; fall back to a
      // selection trick. Keeping this minimal — localhost + https work.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={[
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
        copied
          ? "border-teal-700 bg-teal-800 text-sand-50"
          : "border-[color:var(--hairline)] bg-white text-[color:var(--ink-soft)] hover:border-teal-700 hover:text-teal-900",
      ].join(" ")}
      title={value}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span className="font-semibold">{label}:</span>
      <span className="truncate">{copied ? "Copied" : value}</span>
    </button>
  );
}

function OutcomeButton({
  variant,
  Icon,
  label,
  onClick,
}: {
  variant: "primary" | "amber" | "coral" | "ghost";
  Icon: (p: { className?: string }) => React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const classes = {
    primary:
      "bg-teal-800 text-sand-50 border-teal-800 hover:bg-teal-900",
    amber:
      "bg-amber-100 text-amber-600 border-amber-500/50 hover:border-amber-600",
    coral:
      "bg-coral-100 text-coral-600 border-coral-500/50 hover:border-coral-600",
    ghost:
      "bg-white text-[color:var(--ink-soft)] border-[color:var(--hairline)] hover:bg-sand-100",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${classes}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
