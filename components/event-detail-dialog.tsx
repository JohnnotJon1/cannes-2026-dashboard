"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Lock,
  Building2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import type {
  AnyEvent,
  EventStatus,
  StatusMap,
  UserProfile,
} from "@/types";
import { EVENT_STATUSES, EMPTY_PROFILE } from "@/types";
import { StatusBadge } from "./status-badge";
import { formatEventDateTime, resolveStatus } from "@/lib/filters";
import { RegistrationAssistPanel } from "./registration-assist-panel";
import { buildRegistrationUrl } from "@/lib/registration";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";

type Props = {
  event: AnyEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusMap: StatusMap;
  setStatus: (eventId: string, status: EventStatus) => void;
  setNote: (eventId: string, note: string) => void;
  onDeleteCustom?: (eventId: string) => void;
};

// Outer shell owns the Radix Dialog so close/open animations stay smooth.
// The stateful body is split out and `key`-ed by event.id so per-event
// state (e.g. assist-panel visibility) resets cleanly across events.
export function EventDetailDialog({
  event,
  open,
  onOpenChange,
  statusMap,
  setStatus,
  setNote,
  onDeleteCustom,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          {event && (
            <EventDetailBody
              key={event.id}
              event={event}
              statusMap={statusMap}
              setStatus={setStatus}
              setNote={setNote}
              onDeleteCustom={onDeleteCustom}
              closeDialog={() => onOpenChange(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EventDetailBody({
  event,
  statusMap,
  setStatus,
  setNote,
  onDeleteCustom,
  closeDialog,
}: {
  event: AnyEvent;
  statusMap: StatusMap;
  setStatus: (eventId: string, status: EventStatus) => void;
  setNote: (eventId: string, note: string) => void;
  onDeleteCustom?: (eventId: string) => void;
  closeDialog: () => void;
}) {
  const [profile] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    EMPTY_PROFILE
  );
  const [assistOpen, setAssistOpen] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<EventStatus | null>(
    null
  );

  const current = resolveStatus(event, statusMap);
  const record = statusMap[event.id];
  const isCustom = "isCustom" in event && event.isCustom;
  const url = buildRegistrationUrl(event, profile);

  const handleRegisterMe = () => {
    if (!url) return;
    // Capture the prior status so the user can Cancel back to it.
    setPreviousStatus(current);
    setStatus(event.id, "pending");
    window.open(url, "_blank", "noopener,noreferrer");
    setAssistOpen(true);
  };

  const handleConfirm = (status: EventStatus) => {
    setStatus(event.id, status);
    setAssistOpen(false);
  };

  const handleCancel = () => {
    if (previousStatus) {
      setStatus(event.id, previousStatus);
    }
    setAssistOpen(false);
  };

  return (
    <>
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
            <span>{prettyType(event.registrationType)}</span>
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

        {url && !assistOpen && (
          <button
            type="button"
            onClick={handleRegisterMe}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-coral-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(214,90,58,0.7)] transition-colors hover:bg-coral-600 sm:w-auto"
          >
            <Wand2 className="h-4 w-4" />
            Register me
          </button>
        )}

        {!url && (
          <p className="rounded-xl border border-[color:var(--hairline)] bg-sand-100 px-3.5 py-2.5 text-[13px] text-[color:var(--ink-soft)]">
            No public registration URL. {event.nextAction ?? "See the source below for the manual path."}
          </p>
        )}

        {url && assistOpen && (
          <RegistrationAssistPanel
            event={event}
            profile={profile}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
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
              closeDialog();
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
    </>
  );
}

function prettyType(t: AnyEvent["registrationType"]) {
  switch (t) {
    case "open":
      return "Open RSVP. Anyone can register.";
    case "invite-only":
      return "Invite-only. Rep or warm intro required.";
    case "application":
      return "Application. Curated guest list.";
    case "press":
      return "Press / pitch. Story angle required.";
    default:
      return "Registration path unknown";
  }
}
