"use client";

import { useState } from "react";
import type { PersonSignal } from "@/types";
import { resolvePhotoUrl } from "@/components/person-card";

/**
 * A single avatar in the hero proof stack. Resolves a real face via the
 * shared resolvePhotoUrl (prefers self-refreshing unavatar.io/twitter over
 * expiring media.licdn.com URLs) and falls back to a clean initials chip on
 * load error, so the stack can never show a broken-image icon.
 */
export function HeroAvatar({ person }: { person: PersonSignal }) {
  const [failed, setFailed] = useState(false);
  const src = resolvePhotoUrl(person);
  const initials = person.name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!src || failed) {
    return (
      <span
        title={person.name}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-[10px] font-semibold text-sand-50 ring-2 ring-sand-50 shadow"
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={person.name}
      title={`${person.name} · ${person.company}`}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-8 w-8 rounded-full bg-teal-700 object-cover ring-2 ring-sand-50 shadow"
    />
  );
}
