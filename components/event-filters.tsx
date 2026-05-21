"use client";

import { Search } from "lucide-react";
import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  type EventCategory,
  type EventStatus,
} from "@/types";
import { type FilterState } from "@/lib/filters";

type Props = {
  filters: FilterState;
  setFilters: (next: FilterState | ((prev: FilterState) => FilterState)) => void;
  totalCount: number;
  visibleCount: number;
};

// Cannes Lions 2026 runs Mon Jun 22 – Fri Jun 26. We also show
// Sun Jun 21 for pre-Cannes events.
const DATE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "2026-06-21", label: "Sun 21" },
  { value: "2026-06-22", label: "Mon 22" },
  { value: "2026-06-23", label: "Tue 23" },
  { value: "2026-06-24", label: "Wed 24" },
  { value: "2026-06-25", label: "Thu 25" },
  { value: "2026-06-26", label: "Fri 26" },
];

export function EventFilters({
  filters,
  setFilters,
  totalCount,
  visibleCount,
}: Props) {
  const toggleCategory = (c: EventCategory) =>
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(c)
        ? prev.categories.filter((x) => x !== c)
        : [...prev.categories, c],
    }));

  const toggleStatus = (s: EventStatus) =>
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(s)
        ? prev.statuses.filter((x) => x !== s)
        : [...prev.statuses, s],
    }));

  return (
    <div className="space-y-4 rounded-2xl border border-[color:var(--hairline)] bg-white/70 p-4 lg:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
          <input
            type="search"
            placeholder="Search events, organizers, venues…"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="!pl-9"
          />
        </div>
        <div className="text-[13px] text-[color:var(--muted)]">
          <strong className="text-teal-900">{visibleCount}</strong> of {totalCount} events
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FilterGroup label="Date">
          <div className="flex flex-wrap gap-1.5">
            {DATE_OPTIONS.map((opt) => {
              const active = filters.dateRange === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, dateRange: opt.value }))
                  }
                  className={chip(active)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        <FilterGroup label="Category">
          <div className="flex flex-wrap gap-1.5">
            {EVENT_CATEGORIES.map((c) => {
              const active = filters.categories.includes(c.value);
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => toggleCategory(c.value)}
                  className={chip(active)}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </FilterGroup>

        <FilterGroup label="Status">
          <div className="flex flex-wrap gap-1.5">
            {EVENT_STATUSES.map((s) => {
              const active = filters.statuses.includes(s.value);
              return (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={chip(active)}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function chip(active: boolean): string {
  return [
    "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
    active
      ? "bg-teal-800 text-sand-50 border-teal-800"
      : "bg-white text-[color:var(--ink-soft)] border-[color:var(--hairline)] hover:border-teal-700 hover:text-teal-900",
  ].join(" ");
}
