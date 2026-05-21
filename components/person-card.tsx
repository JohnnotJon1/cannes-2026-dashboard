"use client";

import { useState } from "react";
import { MessageSquareQuote, Building2, Trash2 } from "lucide-react";
import type { PersonSignal } from "@/types";

// Resolve a profile photo URL when we can. Priority:
//   1. Explicit `photoUrl` (pulled from LinkedIn via Apify, or curated manually)
//   2. Twitter avatar via unavatar.io (for X-sourced entries)
//   3. null → initials fallback rendered by the card
function resolvePhotoUrl(person: PersonSignal): string | null {
  if (person.photoUrl) return person.photoUrl;
  if (person.twitterUrl) {
    const m = person.twitterUrl.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/i);
    if (m && m[1] && !/^(home|explore|search|i|hashtag)$/i.test(m[1])) {
      return `https://unavatar.io/twitter/${m[1]}?fallback=false`;
    }
  }
  return null;
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.78C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.78 24h20.44C23.2 24 24 23.22 24 22.26V1.74C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
      <path d="M18.244 2H21l-6.52 7.46L22 22h-6.84l-4.78-6.27L4.8 22H2l7-8.01L2 2h6.91l4.34 5.74L18.244 2Zm-1.2 18h1.59L7.04 4h-1.7l11.7 16Z" />
    </svg>
  );
}

export function PersonCard({
  person,
  isHighlighted,
  cardRef,
  isOwned,
  onRemove,
}: {
  person: PersonSignal;
  isHighlighted?: boolean;
  cardRef?: (el: HTMLElement | null) => void;
  isOwned?: boolean;
  onRemove?: (id: string) => Promise<void> | void;
}) {
  const [removing, setRemoving] = useState(false);
  const initials = person.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const photoUrl = resolvePhotoUrl(person);
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = photoUrl && !photoFailed;

  const linkValid = (url?: string) => !!url && url !== "#sample" && url !== "#";

  // Whole-card click via stretched-link. LinkedIn wins over X; if neither
  // is valid the card is not clickable. The "primary" anchor below carries
  // the before:absolute before:inset-0 pseudo-element that covers the
  // entire article; all OTHER interactive elements bump to z-10 so they
  // remain individually clickable.
  const liIsPrimary = linkValid(person.linkedinUrl);
  const twIsPrimary = !liIsPrimary && linkValid(person.twitterUrl);
  const hasPrimary = liIsPrimary || twIsPrimary;

  return (
    <article
      ref={cardRef}
      className={[
        "card-lift relative flex h-full flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_0_rgba(13,61,58,0.04)] transition",
        hasPrimary ? "cursor-pointer" : "",
        isHighlighted
          ? "border-coral-500 ring-2 ring-coral-500/60 ring-offset-2 ring-offset-sand-50"
          : "border-[color:var(--hairline)]",
      ].join(" ")}
    >
      {isHighlighted && (
        <div className="-mt-1 mb-2 inline-flex w-fit items-center rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-coral-700">
          You're on the list ✓
        </div>
      )}
      <div className="flex items-start gap-3">
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            onError={() => setPhotoFailed(true)}
            className="h-12 w-12 shrink-0 rounded-full bg-teal-100 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal-100 font-display text-base font-semibold text-teal-900"
            aria-hidden
          >
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold leading-snug text-teal-900">
            {person.name}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-[color:var(--muted)]">
            <span>{person.role}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 text-[color:var(--ink-soft)]">
              <Building2 className="h-3 w-3" />
              {person.company}
            </span>
          </p>
        </div>
      </div>

      {person.isSample && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full border border-coral-500/40 bg-coral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-coral-600">
            Sample data
          </span>
        </div>
      )}

      <blockquote className="mt-4 rounded-xl bg-sand-50 px-3 py-2.5 text-[13.5px] leading-relaxed text-teal-900 ring-1 ring-[color:var(--hairline)]">
        <MessageSquareQuote className="mb-1 h-3.5 w-3.5 text-coral-500" />
        “{person.sourceQuote}”
      </blockquote>

      <div className="mt-auto flex items-center gap-3 pt-3">
        {linkValid(person.linkedinUrl) ? (
          <a
            href={person.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on LinkedIn`}
            className={[
              "inline-flex items-center gap-1 text-[12px] font-medium text-teal-700 hover:text-teal-900",
              liIsPrimary
                ? "before:absolute before:inset-0 before:rounded-2xl before:content-['']"
                : "relative z-10",
            ].join(" ")}
          >
            <LinkedInLogo /> LinkedIn
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 text-[12px] text-[color:var(--muted)]" title="Sample data, no real link">
            <LinkedInLogo /> …
          </span>
        )}
        {linkValid(person.twitterUrl) ? (
          <a
            href={person.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on X`}
            className={[
              "inline-flex items-center text-teal-700 hover:text-teal-900",
              twIsPrimary
                ? "before:absolute before:inset-0 before:rounded-2xl before:content-['']"
                : "relative z-10",
            ].join(" ")}
          >
            <XLogo />
          </a>
        ) : null}
        {isOwned && onRemove && (
          <button
            type="button"
            disabled={removing}
            onClick={async () => {
              if (typeof window !== "undefined" &&
                !window.confirm("Remove yourself from the Cannes 2026 list?")) return;
              setRemoving(true);
              try { await onRemove(person.id); } finally { setRemoving(false); }
            }}
            className="relative z-10 ml-auto inline-flex items-center gap-1 rounded-full border border-coral-200 bg-coral-50 px-2 py-0.5 text-[11px] font-medium text-coral-700 transition hover:bg-coral-100 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            {removing ? "Removing…" : "Remove me"}
          </button>
        )}
      </div>
    </article>
  );
}

// Compact row variant used in list view. Same data as PersonCard but
// laid out horizontally: thumbnail + name/role/company + year badge +
// LinkedIn/X icon links. No quote.
export function PersonRow({
  person,
  isHighlighted,
  cardRef,
  isOwned,
  onRemove,
}: {
  person: PersonSignal;
  isHighlighted?: boolean;
  cardRef?: (el: HTMLElement | null) => void;
  isOwned?: boolean;
  onRemove?: (id: string) => Promise<void> | void;
}) {
  const [removing, setRemoving] = useState(false);
  const initials = person.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const photoUrl = resolvePhotoUrl(person);
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = photoUrl && !photoFailed;

  const linkValid = (url?: string) => !!url && url !== "#sample" && url !== "#";

  // Whole-row click via stretched-link. Same priority as PersonCard:
  // LinkedIn wins over X; X is fallback; otherwise no row click.
  const liIsPrimary = linkValid(person.linkedinUrl);
  const twIsPrimary = !liIsPrimary && linkValid(person.twitterUrl);
  const hasPrimary = liIsPrimary || twIsPrimary;

  return (
    <article
      ref={cardRef}
      className={[
        "card-lift relative flex items-center gap-4 rounded-xl border bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(13,61,58,0.04)] transition sm:px-4",
        hasPrimary ? "cursor-pointer" : "",
        isHighlighted
          ? "border-coral-500 ring-2 ring-coral-500/60 ring-offset-2 ring-offset-sand-50"
          : "border-[color:var(--hairline)]",
      ].join(" ")}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          onError={() => setPhotoFailed(true)}
          className="h-11 w-11 shrink-0 rounded-full bg-teal-100 object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-100 font-display text-sm font-semibold text-teal-900"
          aria-hidden
        >
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-[15px] font-semibold leading-snug text-teal-900">
          {person.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-x-1.5 truncate text-[12.5px] text-[color:var(--muted)]">
          <span className="truncate">{person.role}</span>
          {person.role && person.company && <span aria-hidden>·</span>}
          {person.company && (
            <span className="inline-flex min-w-0 items-center gap-1 truncate text-[color:var(--ink-soft)]">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{person.company}</span>
            </span>
          )}
        </p>
      </div>

      {person.sourceQuote &&
        (linkValid(person.sourcePostUrl) ? (
          <a
            href={person.sourcePostUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="See post"
            className="relative z-10 hidden min-w-0 flex-1 items-center gap-1.5 truncate text-[12.5px] italic text-[color:var(--muted)] transition-colors hover:text-teal-700 md:flex"
          >
            <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-coral-500" />
            <span className="truncate">{person.sourceQuote}</span>
          </a>
        ) : (
          <span className="hidden min-w-0 flex-1 items-center gap-1.5 truncate text-[12.5px] italic text-[color:var(--muted)] md:flex">
            <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-coral-500" />
            <span className="truncate">{person.sourceQuote}</span>
          </span>
        ))}

      {/* Right cluster: icons + optional Remove pill. Reserves a stable
          minimum width on sm+ so the column structure (name + quote + this
          cluster) lines up across rows regardless of whether the user owns
          the entry. Without this, owned rows compressed flex-1 columns and
          shifted the quote leftward. */}
      <div className="flex shrink-0 items-center justify-end gap-3 sm:min-w-[9rem]">
        {linkValid(person.linkedinUrl) ? (
          <a
            href={person.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on LinkedIn`}
            className={[
              "inline-flex items-center text-teal-700 hover:text-teal-900",
              liIsPrimary
                ? "before:absolute before:inset-0 before:rounded-xl before:content-['']"
                : "relative z-10",
            ].join(" ")}
          >
            <LinkedInLogo />
          </a>
        ) : null}
        {linkValid(person.twitterUrl) ? (
          <a
            href={person.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${person.name} on X`}
            className={[
              "inline-flex items-center text-teal-700 hover:text-teal-900",
              twIsPrimary
                ? "before:absolute before:inset-0 before:rounded-xl before:content-['']"
                : "relative z-10",
            ].join(" ")}
          >
            <XLogo />
          </a>
        ) : null}
        {isOwned && onRemove && (
          <button
            type="button"
            disabled={removing}
            onClick={async () => {
              if (typeof window !== "undefined" &&
                !window.confirm("Remove yourself from the Cannes 2026 list?")) return;
              setRemoving(true);
              try { await onRemove(person.id); } finally { setRemoving(false); }
            }}
            aria-label="Remove me from the list"
            title="Remove me"
            className="relative z-10 inline-flex items-center gap-1 rounded-full border border-coral-200 bg-coral-50 px-2 py-0.5 text-[11px] font-medium text-coral-700 transition hover:bg-coral-100 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">{removing ? "Removing…" : "Remove"}</span>
          </button>
        )}
      </div>
    </article>
  );
}
