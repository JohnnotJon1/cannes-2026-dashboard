"use client";

import { Search, Filter, X, LayoutGrid, AlignJustify, Building2, Briefcase, UserPlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { PersonSignal } from "@/types";
import { PersonCard, PersonRow } from "./person-card";
import { EmptyState } from "./empty-state";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";

// How many top-N entries to surface in each filter pill row.
const TOP_COMPANIES = 20;
const TOP_ROLES = 15;

type Filter = "all" | "going-this-year" | "attended-last-year";
type ViewMode = "grid" | "list";

interface SubmissionReceipt {
  id: string;
  deleteToken: string;
  name: string;
  addedAt: string;
}

/** Read receipts from localStorage. SSR-safe. */
function readReceipts(): SubmissionReceipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.submittedReceipts);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SubmissionReceipt[]) : [];
  } catch {
    return [];
  }
}

function writeReceipts(list: SubmissionReceipt[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.submittedReceipts,
      JSON.stringify(list)
    );
  } catch {
    // Quota / disabled storage — silent failure.
  }
}

/** Drop receipts whose id is no longer present in the server's list. */
function pruneStaleReceipts(liveIds: Set<string>): void {
  const list = readReceipts();
  const next = list.filter((r) => liveIds.has(r.id));
  if (next.length !== list.length) writeReceipts(next);
}

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "going-this-year", label: "Going this year" },
  { value: "attended-last-year", label: "Last year's crew" },
];

const PAGE_SIZE = 18;

export function PeopleExplorer({ people }: { people: PersonSignal[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    STORAGE_KEYS.peopleViewMode,
    "grid"
  );

  // "I just added myself!" — read ?just-added=u-xxxx and pulse the
  // matching card for ~4s once it's in the merged list. The highlight
  // clears after the timeout so it doesn't persist across navigations.
  const searchParams = useSearchParams();
  const justAddedId = searchParams?.get("just-added") ?? null;
  const [highlightId, setHighlightId] = useState<string | null>(justAddedId);
  useEffect(() => {
    if (!justAddedId) return;
    setHighlightId(justAddedId);
    const t = setTimeout(() => setHighlightId(null), 4500);
    return () => clearTimeout(t);
  }, [justAddedId]);

  // Self-submitted attendees (KV) layered on top of the static seed.
  // Fetched on mount; an empty array if KV is empty or the API errors.
  const [submitted, setSubmitted] = useState<PersonSignal[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/people", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { submitted: [] }))
      .then((d) => {
        if (cancelled || !Array.isArray(d?.submitted)) return;
        setSubmitted(d.submitted);
        // Prune stale receipts: any local id whose entry no longer
        // exists (John removed it via /admin, KV expired, etc.) should
        // drop from localStorage so the user isn't shown a phantom
        // "Remove me" button later.
        pruneStaleReceipts(new Set(d.submitted.map((p: PersonSignal) => p.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Local receipts → the set of ids the current browser is allowed to
  // self-delete. Read once on mount; mutated in place when the user
  // clicks "Remove me". Survives page reloads.
  const [receipts, setReceipts] = useState<SubmissionReceipt[]>([]);
  useEffect(() => {
    setReceipts(readReceipts());
  }, []);
  const ownReceiptIds = useMemo(
    () => new Set(receipts.map((r) => r.id)),
    [receipts]
  );

  const handleRemoveOwn = async (id: string) => {
    const receipt = receipts.find((r) => r.id === id);
    if (!receipt) return;
    const res = await fetch(
      `/api/submit/${encodeURIComponent(id)}?token=${encodeURIComponent(receipt.deleteToken)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      alert("Couldn't remove that entry. Refresh and try again, or email John.");
      return;
    }
    // Optimistic local removal: drop from the visible list and from
    // localStorage. CDN cache flush handles the persistent layer.
    setSubmitted((prev) => prev.filter((p) => p.id !== id));
    setReceipts((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeReceipts(next);
      return next;
    });
  };

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

  // Top-N companies and roles for the filter pill rows. Recomputed
  // whenever the merged list changes (i.e., when KV submissions arrive).
  const topCompanies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of ordered) {
      const c = p.company?.trim();
      if (!c) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 2) // only show companies with 2+ people to avoid a long tail of singletons
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_COMPANIES);
  }, [ordered]);

  const topRoles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of ordered) {
      const r = p.role?.trim();
      if (!r) continue;
      counts.set(r, (counts.get(r) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_ROLES);
  }, [ordered]);

  const filtered = useMemo(() => {
    return ordered.filter((p) => {
      if (filter !== "all" && p.yearSignal !== filter) return false;
      if (selectedCompany && p.company !== selectedCompany) return false;
      if (selectedRole && p.role !== selectedRole) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [p.name, p.company, p.role, p.sourceQuote, p.signalReason]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ordered, search, filter, selectedCompany, selectedRole]);

  // PaginatedList is remounted (and its visibleCount resets) whenever any
  // input that changes "what we're showing" changes.
  const listKey = `${filter}|${search}|${viewMode}|${selectedCompany ?? ""}|${selectedRole ?? ""}`;

  const anyFilterActive =
    search !== "" || filter !== "all" || selectedCompany !== null || selectedRole !== null;
  const clearAll = () => {
    setSearch("");
    setFilter("all");
    setSelectedCompany(null);
    setSelectedRole(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border border-[color:var(--hairline)] bg-white/70 p-4 lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              type="search"
              placeholder="Find yourself or someone you know…"
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
          {anyFilterActive && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-[color:var(--hairline)] bg-sand-50 px-2.5 py-1 text-[12px] font-medium text-teal-900 hover:bg-sand-100"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Top-N company pill row */}
        {topCompanies.length > 0 && (
          <FacetPillRow
            icon={Building2}
            label="Company"
            options={topCompanies}
            selected={selectedCompany}
            onSelect={(value) => setSelectedCompany(value)}
          />
        )}

        {/* Top-N role pill row */}
        {topRoles.length > 0 && (
          <FacetPillRow
            icon={Briefcase}
            label="Role"
            options={topRoles}
            selected={selectedRole}
            onSelect={(value) => setSelectedRole(value)}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        search.trim().length >= 2 &&
        filter === "all" &&
        !selectedCompany &&
        !selectedRole ? (
          // "Find Yourself" invite: the visitor typed a name (or anything 2+
          // chars), no other filters narrow the result, and we got zero
          // matches. Turn it into a self-submission opportunity.
          <div className="rounded-2xl border border-coral-200 bg-coral-50/60 p-6 text-center">
            <p className="font-display text-lg font-semibold text-teal-900">
              No one named <span className="text-coral-700">&ldquo;{search.trim()}&rdquo;</span> is on the list yet.
            </p>
            <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
              Want to be the first? Drop your name, company, and LinkedIn and
              you&apos;ll appear on the list in seconds.
            </p>
            <Link
              href={`/submit?prefillName=${encodeURIComponent(search.trim())}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-900 px-5 py-2.5 text-[14px] font-semibold text-sand-50 shadow-md shadow-teal-900/15 transition hover:bg-teal-800"
            >
              <UserPlus className="h-4 w-4" />
              Add yourself
            </Link>
          </div>
        ) : (
          <EmptyState
            icon={Filter}
            title="No people match"
            description="Try clearing the filters or switching to the All view."
          />
        )
      ) : (
        <PaginatedList
          key={listKey}
          items={filtered}
          viewMode={viewMode}
          highlightId={highlightId}
          ownReceiptIds={ownReceiptIds}
          onRemoveOwn={handleRemoveOwn}
        />
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
      {btn("list", AlignJustify, "List view")}
    </div>
  );
}

function PaginatedList({
  items,
  viewMode,
  highlightId,
  ownReceiptIds,
  onRemoveOwn,
}: {
  items: PersonSignal[];
  viewMode: ViewMode;
  highlightId: string | null;
  ownReceiptIds: Set<string>;
  onRemoveOwn: (id: string) => Promise<void> | void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLElement | null>(null);
  const scrolledOnceRef = useRef(false);
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

  // Scroll the highlighted card into view once, after it lands in the DOM.
  // The KV fetch in PeopleExplorer is async, so the just-added card may not
  // exist yet on first render — we wait for the ref to populate.
  useEffect(() => {
    if (!highlightId || scrolledOnceRef.current) return;
    const el = highlightRef.current;
    if (!el) return;
    scrolledOnceRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, items]);

  const slice = items.slice(0, visibleCount);
  const setHighlightRef = (id: string) => (el: HTMLElement | null) => {
    if (id === highlightId && el) highlightRef.current = el;
  };

  return (
    <>
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              isHighlighted={p.id === highlightId}
              cardRef={setHighlightRef(p.id)}
              isOwned={ownReceiptIds.has(p.id)}
              onRemove={onRemoveOwn}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {slice.map((p) => (
            <PersonRow
              key={p.id}
              person={p}
              isHighlighted={p.id === highlightId}
              cardRef={setHighlightRef(p.id)}
              isOwned={ownReceiptIds.has(p.id)}
              onRemove={onRemoveOwn}
            />
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

/**
 * Horizontally-scrolling row of filter pills for a single facet
 * (Company or Role). Click a pill to single-select; click again to
 * clear. Counts shown in muted text so the label leads.
 */
function FacetPillRow({
  icon: Icon,
  label,
  options,
  selected,
  onSelect,
}: {
  icon: typeof Building2;
  label: string;
  options: [string, number][];
  selected: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 -mx-1 overflow-x-auto pb-0.5 pl-1 [scrollbar-width:thin]">
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted)]">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      {options.map(([value, count]) => {
        const active = selected === value;
        return (
          <button
            type="button"
            key={value}
            onClick={() => onSelect(active ? null : value)}
            title={active ? `Clear ${label.toLowerCase()} filter` : `Show only ${value}`}
            className={[
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
              active
                ? "bg-teal-800 text-sand-50 border-teal-800"
                : "bg-white text-[color:var(--ink-soft)] border-[color:var(--hairline)] hover:border-teal-700 hover:text-teal-900",
            ].join(" ")}
          >
            <span className="truncate max-w-[14rem]">{value}</span>
            <span
              className={[
                "text-[11px]",
                active ? "text-sand-50/80" : "text-[color:var(--muted)]",
              ].join(" ")}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
