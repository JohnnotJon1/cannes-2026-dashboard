"use client";

import { Search, Filter, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PersonSignal } from "@/types";
import { PersonCard } from "./person-card";
import { EmptyState } from "./empty-state";

type Filter = "all" | "going-this-year" | "attended-last-year";

const TABS: { value: Filter; label: string }[] = [
  { value: "all", label: "All signals" },
  { value: "going-this-year", label: "Going this year" },
  { value: "attended-last-year", label: "Last year's crew" },
];

export function PeopleExplorer({ people }: { people: PersonSignal[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    return people.filter((p) => {
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
  }, [people, search, filter]);

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
          <div className="text-[13px] text-[color:var(--muted)]">
            <strong className="text-teal-900">{visible.length}</strong> of {people.length} people
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

      {visible.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No people match"
          description="Try clearing the search or switching to the All signals view."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}
