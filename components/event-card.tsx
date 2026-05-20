"use client";

import { MapPin, ArrowUpRight, Sparkles } from "lucide-react";
import type { AnyEvent, EventStatus } from "@/types";
import { StatusBadge } from "./status-badge";
import { formatEventDateTime } from "@/lib/filters";

function gradientFor(category: AnyEvent["category"]): string {
  switch (category) {
    case "beach-club":
    case "yacht":
      return "hero-gradient-teal";
    case "party":
    case "dinner":
    case "brunch":
      return "hero-gradient-coral";
    case "panel":
    case "workshop":
    case "awards":
      return "hero-gradient-amber";
    default:
      return "hero-gradient";
  }
}

function categoryLabel(c: AnyEvent["category"]): string {
  return c
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function EventCard({
  event,
  status,
  onOpen,
}: {
  event: AnyEvent;
  status: EventStatus;
  onOpen: () => void;
}) {
  const isCustom = "isCustom" in event && event.isCustom;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-white text-left shadow-[0_1px_0_rgba(13,61,58,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
    >
      <div
        className={`noise relative h-32 w-full overflow-hidden ${
          event.imageUrl ? "bg-teal-900" : gradientFor(event.category)
        }`}
      >
        {event.imageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {/* Legibility scrim so the chips + organizer text stay readable */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/65"
              aria-hidden
            />
          </>
        )}
        <div className="absolute inset-0 flex flex-col justify-between p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-900">
              {categoryLabel(event.category)}
            </span>
            {isCustom && (
              <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-coral-600">
                Your event
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            <span>{event.organizer}</span>
            <span className="opacity-95">{formatEventDateTime(event)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-[19px] font-semibold leading-snug text-teal-900">
          {event.name}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[color:var(--muted)]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>
        <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
          {event.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-teal-700 group-hover:text-teal-900">
            Details
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
        {event.nextAction && status !== "registered" && status !== "attended" && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-sand-100 px-2.5 py-2 text-[12px] leading-snug text-teal-900">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-600" />
            <span>
              <strong className="font-semibold">Next:</strong> {event.nextAction}
            </span>
          </p>
        )}
      </div>
    </button>
  );
}
