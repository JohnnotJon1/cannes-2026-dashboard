"use client";

import { MapPin } from "lucide-react";
import type { AnyEvent, UserProfile } from "@/types";
import { formatEventDateTime } from "@/lib/filters";
import { buildRegistrationUrl } from "@/lib/registration";

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

// Show a Register button only when there's actually something to register
// for: a working URL AND a registration model that lets the user self-serve.
// invite-only, press-only, and festival-pass-required events get a sentence
// instead.
function isRegisterable(event: AnyEvent): boolean {
  if (!event.registrationUrl) return false;
  if (event.registrationType === "invite-only") return false;
  if (event.registrationType === "press") return false;
  if (event.tags?.includes("festival-pass")) return false;
  return true;
}

function noRegistrationMessage(event: AnyEvent): string {
  if (event.nextAction) return event.nextAction;
  switch (event.registrationType) {
    case "invite-only":
      return "Invite only — no public registration link.";
    case "press":
      return "Press only.";
    default:
      return "Registration page TBA.";
  }
}

export function EventCard({
  event,
  profile,
  onOpen,
}: {
  event: AnyEvent;
  profile: UserProfile;
  onOpen: () => void;
}) {
  const isCustom = "isCustom" in event && event.isCustom;
  const canRegister = isRegisterable(event);
  const registerUrl = canRegister ? buildRegistrationUrl(event, profile) : null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label={`Open details for ${event.name}`}
      className="card-lift group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-white text-left shadow-[0_1px_0_rgba(13,61,58,0.04)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
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

        <div className="mt-auto pt-4">
          {registerUrl ? (
            <a
              href={registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-600"
            >
              Register
            </a>
          ) : (
            <p className="text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
              {noRegistrationMessage(event)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
