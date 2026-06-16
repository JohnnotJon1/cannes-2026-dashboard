import type { PersonSignal } from "@/types";
import { HeroAvatar } from "@/components/hero-avatar";

/**
 * Hero proof block: a glass-morphic chip with the total going count + a small
 * overlapping avatar stack. The featured faces are a curated set of marquee
 * 2026 attendees (resolved via unavatar.io/twitter so they never expire); we
 * top up to 5 with any other Twitter-resolvable attendee. Each avatar degrades
 * to a clean initials chip on load error (see HeroAvatar), so the stack can
 * never show a broken image again.
 */

// Recognizable confirmed 2026 names, each with a verified Twitter handle in the
// data so unavatar resolves a real face.
const FEATURED_NAMES = [
  "Oprah Winfrey",
  "Demis Hassabis",
  "Adam Mosseri",
  "Stella McCartney",
  "Dhar Mann",
  "Mel Robbins",
  "Steven Bartlett",
];

function hasTwitter(p: PersonSignal): boolean {
  return /(?:twitter\.com|x\.com)\/[^/?#]+/i.test(p.twitterUrl || "");
}

function pickFeatured(people: PersonSignal[]): PersonSignal[] {
  const byName = new Map(people.map((p) => [p.name, p]));
  const featured: PersonSignal[] = [];
  const used = new Set<string>();

  for (const name of FEATURED_NAMES) {
    const p = byName.get(name);
    if (p && hasTwitter(p) && !used.has(p.id)) {
      featured.push(p);
      used.add(p.id);
    }
    if (featured.length === 5) return featured;
  }
  // Top up with any other Twitter-resolvable attendee (stable faces).
  for (const p of people) {
    if (featured.length === 5) break;
    if (!used.has(p.id) && hasTwitter(p)) {
      featured.push(p);
      used.add(p.id);
    }
  }
  return featured;
}

export function HeroProof({ people }: { people: PersonSignal[] }) {
  const total = people.length.toLocaleString("en-US");
  const featured = pickFeatured(people);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      {/* Glass chip with live dot + total count */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-sand-50 backdrop-blur-sm">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-300" />
        </span>
        {total} going
      </div>

      {/* Avatar stack */}
      {featured.length > 0 && (
        <div className="flex -space-x-2">
          {featured.map((p) => (
            <HeroAvatar key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}
