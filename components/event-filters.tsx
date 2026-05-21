"use client";

import { Search } from "lucide-react";
import { type FilterState } from "@/lib/filters";

type Props = {
  filters: FilterState;
  setFilters: (next: FilterState | ((prev: FilterState) => FilterState)) => void;
};

export function EventFilters({ filters, setFilters }: Props) {
  return (
    <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/70 p-3 lg:p-4">
      <div className="relative">
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
    </div>
  );
}
