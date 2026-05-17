"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Lock,
  Building2,
} from "lucide-react";
import type { AnyEvent, EventStatus, StatusMap } from "@/types";
import { EVENT_STATUSES } from "@/types";
import { StatusBadge } from "./status-badge";
import { formatEventDateTime, resolveStatus } from "@/lib/filters";

type Props = {
  event: AnyEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusMap: StatusMap;
  setStatus: (eventId: string, status: EventStatus) => void;
  setNote: (eventId: string, note: string) => void;
  onDeleteCustom?: (eventId: string) => void;
};

export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  statusMap,
  setStatus,
  setNote,
  onDeleteCustom,
}: Props) {
  if (!event) return null;
  const current = resolveStatus(event, statusMap);
  const record = statusMap[event.id];
  const isCustom = "isCustom" in event && event.isCustom;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="hero-gradient-teal relative h-28 w-full overflow-hidden rounded-t-2xl">
            <div className="absolute inset-0 flex items-start justify-between p-4 text-sand-50">
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
                {event.category.replace("-", " ")}
              </span>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sand-50 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="absolute bottom-3 left-4 right-4 text-sand-50">
              <p className="text-[12px] font-medium opacity-90">{event.organizer}</p>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <Dialog.Title asChild>
              <h2 className="font-display text-2xl font-semibold leading-tight text-teal-900">
                {event.name}
              </h2>
            </Dialog.Title>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={current} />
              {isCustom && (
                <span className="rounded-full border border-coral-500/40 bg-coral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-coral-600">
                  Your event
                </span>
              )}
              {event.confidence !== "verified" && !isCustom && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hairline)] bg-sand-50 px-2 py-0.5 text-[11px] font-medium text-[color:var(--muted)]">
                  <ShieldCheck className="h-3 w-3" /> {event.confidence}
                </span>
              )}
            </div>

            <div className="grid gap-2.5 text-[14px] text-[color:var(--ink-soft)]">
              <div className="flex items-start gap-2.5">
                <Calendar className="mt-0.5 h-4 w-4 text-teal-700" />
                <span>{formatEventDateTime(event)}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-teal-700" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 h-4 w-4 text-teal-700" />
                <span>
                  {prettyType(event.registrationType)}
                </span>
              </div>
            </div>

            <Dialog.Description asChild>
              <p className="text-[14.5px] leading-relaxed text-[color:var(--ink)]">
                {event.description}
              </p>
            </Dialog.Description>

            {event.nextAction && (
              <div className="rounded-xl border border-coral-500/30 bg-coral-100/50 p-3.5">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-coral-600">
                  <Sparkles className="h-3.5 w-3.5" /> Next action
                </div>
                <p className="mt-1.5 text-[14px] text-teal-900">{event.nextAction}</p>
              </div>
            )}

            {event.registrationUrl && (
              <a
                href={event.registrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-800 px-4 py-2.5 text-sm font-semibold text-sand-50 transition-colors hover:bg-teal-900 sm:w-auto"
              >
                Open registration
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <div>
              <label className="field-label">Your status</label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_STATUSES.map((s) => {
                  const active = current === s.value;
                  return (
                    <button
                      type="button"
                      key={s.value}
                      onClick={() => setStatus(event.id, s.value)}
                      className={[
                        "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                        active
                          ? "bg-teal-800 text-sand-50 border-teal-800"
                          : "bg-white text-[color:var(--ink-soft)] border-[color:var(--hairline)] hover:border-teal-700 hover:text-teal-900",
                      ].join(" ")}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor={`notes-${event.id}`} className="field-label">
                Private notes
              </label>
              <textarea
                id={`notes-${event.id}`}
                placeholder="Pings sent, who's also going, dinner partner pairings…"
                defaultValue={record?.notes ?? ""}
                onBlur={(e) => setNote(event.id, e.target.value)}
              />
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-[color:var(--muted)]">
                <Lock className="h-3 w-3" />
                Notes save to this browser only.
              </p>
            </div>

            {isCustom && onDeleteCustom && (
              <button
                type="button"
                onClick={() => {
                  onDeleteCustom(event.id);
                  onOpenChange(false);
                }}
                className="text-[12px] font-medium text-coral-600 hover:text-coral-500"
              >
                Delete this event
              </button>
            )}

            <div className="border-t border-[color:var(--hairline)] pt-3 text-[11px] text-[color:var(--muted)]">
              Source: {event.source}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function prettyType(t: AnyEvent["registrationType"]) {
  switch (t) {
    case "open":
      return "Open RSVP — anyone can register";
    case "invite-only":
      return "Invite-only — rep or warm intro required";
    case "application":
      return "Application — curated guest list";
    case "press":
      return "Press / pitch — story angle required";
    default:
      return "Registration path unknown";
  }
}
