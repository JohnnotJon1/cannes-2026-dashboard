"use client";

import { Search, Filter, X, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PersonSignal } from "@/types";
import { PersonCard } from "./person-card";
import { EmptyState } from "./empty-state";

type Filter = "all" | "going-this-year" | "attended-last-year";

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "All signals" },
  { value: "going-this-year", label: "Going this year" },
  { value: "attended-last-year", label: "Last year's crew" },
];

const PAGE_SIZE = 18;

// Stable seed-based shuffle so server and client agree on the initial order
// and "refresh" predictably permutes. xmur3 + sfc32 is overkill but keeps the
// determinism crisp.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function PeopleExplorer({ people }: { people: PersonSignal[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [seed, setSeed] = useState(0); // 0 = source order, >0 = shuffled
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // Curated celebrity entries (Oprah, Stella, Demis, etc. — `p-` prefix) are
  // confirmed Cannes Lions 2026 speakers/honorees but they're not realistic
  // people to bump into and ask for a meeting. Push them to the bottom of the
  // feed so the practical, scrape-sourced names lead. Refresh shuffles each
  // group independently — celebrities stay at the bottom even when shuffled.
  const ordered = useMemo(() => {
    const practical = people.filter((p) => !p.id.startsWith("p-"));
    const celebrities = people.filter((p) => p.id.startsWith("p-"));
    if (seed === 0) return [...practical, ...celebrities];
    return [
      ...seededShuffle(practical, seed),
      ...seededShuffle(celebrities, seed ^ 0x9e3779b9),
    ];
  }, [people, seed]);

  const filtered = useMemo(() => {
    return ordered.filter((p) => {
      if (filter !== "all" && p.yearSignal !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [p.name, p.company, p.role, p.sourceQuote, p.signalReason]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ordered, search, filter]);

  const refresh = useCallback(() => {
    setSeed(Date.now());
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // PaginatedList is remounted (and its visibleCount resets) whenever any
  // input that changes "what we're showing" changes. Cleaner than calling
  // setState in an effect every time a filter flips.
  const listKey = `${filter}|${search}|${seed}`;

  return (
    <div className="space-y-6" ref={scrollAnchorRef}>
      <div className="space-y-4 rounded-2xl border border-[color:var(--hairline)] bg-white/70 p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              type="search"
              placeholder="Search by name, company, or signal…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!pl-9"
            />
          </div>
          <div className="flex items-center gap-3 text-[13px] text-[color:var(--muted)]">
            <span>
              <strong className="text-teal-900">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "signal" : "signals"}
            </span>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--hairline)] bg-sand-50 px-2.5 py-1 text-[12px] font-medium text-teal-900 hover:bg-sand-100"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh feed
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {TABS.map((t) => {
            const active = filter === t.value;
            return (
              <button
                type="button"
                key={t.value}
                onClick={() => setFilter(t.value)}
                className={[
                  "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                  active
                    ? "bg-teal-800 text-sand-50 border-teal-800"
                    : "bg-white text-[color:var(--ink-soft)] border-[color:var(--hairline)] hover:border-teal-700 hover:text-teal-900",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
          {(search || filter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-[color:var(--hairline)] bg-sand-50 px-2.5 py-1 text-[12px] font-medium text-teal-900 hover:bg-sand-100"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No people match"
          description="Try clearing the search or switching to the All signals view."
        />
      ) : (
        <PaginatedList key={listKey} items={filtered} />
      )}
    </div>
  );
}

function PaginatedList({ items }: { items: PersonSignal[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = visibleCount < items.length;

  // IntersectionObserver-based infinite scroll. Watching a sentinel below
  // the list reveals the next page when the user gets close to the bottom.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, items.length]);

  const slice = items.slice(0, visibleCount);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
      <div
        ref={sentinelRef}
        aria-hidden
        className="h-12 grid place-items-center text-[12px] text-[color:var(--muted)]"
      >
        {hasMore ? "Loading more…" : "You've reached the end of the feed."}
      </div>
    </>
  );
}
