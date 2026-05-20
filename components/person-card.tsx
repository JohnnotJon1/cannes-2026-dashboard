"use client";

import { useState } from "react";
import { ExternalLink, MessageSquareQuote, Calendar, Building2 } from "lucide-react";
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

export function PersonCard({ person }: { person: PersonSignal }) {
  const initials = person.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const photoUrl = resolvePhotoUrl(person);
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = photoUrl && !photoFailed;

  const yearLabel =
    person.yearSignal === "going-this-year"
      ? { text: "Going this year", classes: "bg-teal-800 text-sand-50 border-teal-800" }
      : { text: "Posted about last year", classes: "bg-sand-100 text-[color:var(--ink-soft)] border-[color:var(--hairline)]" };

  const linkValid = (url?: string) => !!url && url !== "#sample" && url !== "#";

  return (
    <article className="card-lift flex h-full flex-col rounded-2xl border border-[color:var(--hairline)] bg-white p-5 shadow-[0_1px_0_rgba(13,61,58,0.04)]">
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
          <h3 className="font-display text-lg font-semibold leading-snug text-teal-900">
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

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${yearLabel.classes}`}
        >
          <Calendar className="h-3 w-3" />
          {yearLabel.text}
        </span>
        {person.isSample && (
          <span className="inline-flex items-center rounded-full border border-coral-500/40 bg-coral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-coral-600">
            Sample data
          </span>
        )}
      </div>

      <blockquote className="mt-3 rounded-xl bg-sand-50 px-3 py-2.5 text-[13.5px] leading-relaxed text-teal-900 ring-1 ring-[color:var(--hairline)]">
        <MessageSquareQuote className="mb-1 h-3.5 w-3.5 text-coral-500" />
        “{person.sourceQuote}”
      </blockquote>

      <div className="mt-auto flex items-center gap-3 pt-3">
        {linkValid(person.linkedinUrl) ? (
          <a
            href={person.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-teal-700 hover:text-teal-900"
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
            aria-label="X profile"
            className="inline-flex items-center text-teal-700 hover:text-teal-900"
          >
            <XLogo />
          </a>
        ) : null}
        {linkValid(person.sourcePostUrl) ? (
          <a
            href={person.sourcePostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-teal-700 hover:text-teal-900"
          >
            Source post
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span
            className="ml-auto text-[11px] text-[color:var(--muted)]"
            title="Sample data, no real source link"
          >
            Sample source
          </span>
        )}
      </div>
    </article>
  );
}
