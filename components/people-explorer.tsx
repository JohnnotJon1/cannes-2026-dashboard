"use client";

import { Search, Filter, X, LayoutGrid, LayoutList } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PersonSignal } from "@/types";
import { PersonCard, PersonRow } from "./person-card";
import { EmptyState } from "./empty-state";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";

type Filter = "all" | "going-this-year" | "attended-last-year";
type ViewMode = "grid" | "list";

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "going-this-year", label: "Going this year" },
  { value: "attended-last-year", label: "Last year's crew" },
];

const PAGE_SIZE = 18;

export function PeopleExplorer({ people }: { people: PersonSignal[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    STORAGE_KEYS.peopleViewMode,
    "grid"
  );

  // Self-submitted attendees (KV) layered on top of the static seed.
  // Fetched on mount; an empty array if KV is empty or the API errors.
  const [submitted, setSubmitted] = useState<PersonSignal[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/people", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { submitted: [] }))
      .then((d) => {
        if (!cancelled && Array.isArray(d?.submitted)) setSubmitted(d.submitted);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Curated celebrity entries (Oprah, Stella, Demis, etc. — `p-` prefix) are
  // confirmed Cannes Lions 2026 speakers/honorees but they're not realistic
  // people to bump into and ask for a meeting. Push them to the bottom of the
  // feed so the practical, scrape-sourced names lead.
  //
  // Self-submitted (`u-` prefix) lead the list so a person who just added
  // themselves sees their card at the top.
  const ordered = useMemo(() => {
    const seedIds = new Set(people.map((p) => p.id));
    const seenNames = new Set<string>();
    const merged: PersonSignal[] = [];
    for (const s of submitted) {
      if (seedIds.has(s.id)) continue;
      const nameKey = s.name.trim().toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      merged.push(s);
    }
    for (const p of people) {
      const nameKey = p.name.trim().toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);
      merged.push(p);
    }
    const practical = merged.filter((p) => !p.id.startsWith("p-"));
    const celebrities = merged.filter((p) => p.id.startsWith("p-"));
    return [...practical, ...celebrities];
  }, [people, submitted]);

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

  // PaginatedList is remounted (and its visibleCount resets) whenever any
  // input that changes "what we're showing" changes.
  const listKey = `${filter}|${search}|${viewMode}`;

  return (
    <div className="space-y-6">
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
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
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
          description="Try clearing the search or switching to the All view."
        />
      ) : (
        <PaginatedList key={listKey} items={filtered} viewMode={viewMode} />
      )}
    </div>
  );
}

function ViewToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}) {
  const btn = (mode: ViewMode, Icon: typeof LayoutGrid, label: string) => {
    const active = viewMode === mode;
    return (
      <button
        type="button"
        onClick={() => setViewMode(mode)}
        aria-pressed={active}
        aria-label={label}
        title={label}
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          active
            ? "bg-teal-800 text-sand-50"
            : "text-[color:var(--ink-soft)] hover:bg-sand-100 hover:text-teal-900",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  };
  return (
    <div className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-[color:var(--hairline)] bg-white p-0.5 lg:self-auto">
      {btn("grid", LayoutGrid, "Grid view")}
      {btn("list", LayoutList, "List view")}
    </div>
  );
}

function PaginatedList({
  items,
  viewMode,
}: {
  items: PersonSignal[];
  viewMode: ViewMode;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = visibleCount < items.length;

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
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {slice.map((p) => (
            <PersonRow key={p.id} person={p} />
          ))}
        </div>
      )}
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
