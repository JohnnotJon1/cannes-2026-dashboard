import type { PersonSignal } from "@/types";

/**
 * Hero proof block: a glass-morphic chip with the total going count +
 * a small overlapping avatar stack of 5 attendees with photos. Lives
 * inside the events-off hero on the public deploy.
 *
 * Selection of avatars is deterministic at build time — the first 5
 * non-`p-` prefix entries (matches PeopleExplorer's ordering rules)
 * that have a photoUrl. The hero photo is dark, so each avatar gets
 * a sand-50 ring for legibility.
 */
export function HeroProof({ people }: { people: PersonSignal[] }) {
  const total = people.length.toLocaleString("en-US");
  const featured = people
    .filter((p) => !p.id.startsWith("p-") && p.photoUrl)
    .slice(0, 5);
  const remaining = Math.max(0, people.length - featured.length);

  if (featured.length === 0) {
    // Defensive: if no photos in the seed (shouldn't happen), still
    // show the count chip with no stack.
    return (
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-sand-50 backdrop-blur-sm">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-300" />
        </span>
        {total} going to Cannes 2026
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      {/* Glass chip with live dot + total count */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-sand-50 backdrop-blur-sm">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-300" />
        </span>
        {total} going to Cannes 2026
      </div>

      {/* Avatar stack + remaining tail */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {featured.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.photoUrl}
              alt={p.name}
              title={`${p.name} · ${p.company}`}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-sand-50 shadow"
            />
          ))}
        </div>
        {remaining > 0 && (
          <span className="text-[12px] font-medium text-sand-100/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            +{remaining.toLocaleString("en-US")} more
          </span>
        )}
      </div>
    </div>
  );
}
