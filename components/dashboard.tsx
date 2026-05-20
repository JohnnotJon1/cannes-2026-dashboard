"use client";

import { useMemo, useState } from "react";
import { Calendar, Filter } from "lucide-react";
import type {
  AnyEvent,
  CannesEvent,
  CustomEvent,
  EventStatus,
  EventStatusRecord,
  StatusMap,
} from "@/types";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";
import {
  DEFAULT_FILTERS,
  filterEvents,
  groupEventsByDay,
  sortEventsByDate,
  type FilterState,
} from "@/lib/filters";
import { EventCard } from "./event-card";
import { EventFilters } from "./event-filters";
import { EventDetailDialog } from "./event-detail-dialog";
import { EmptyState } from "./empty-state";
import { DashboardStats } from "./dashboard-stats";
import { ExtensionBanner } from "./extension-banner";
import { resolveStatus } from "@/lib/filters";

type Props = {
  seedEvents: CannesEvent[];
};

export function Dashboard({ seedEvents }: Props) {
  const [statusMap, setStatusMap] = useLocalStorage<StatusMap>(
    STORAGE_KEYS.statuses,
    {}
  );
  const [customEvents, setCustomEvents] = useLocalStorage<CustomEvent[]>(
    STORAGE_KEYS.customEvents,
    []
  );
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);

  const allEvents: AnyEvent[] = useMemo(
    () => sortEventsByDate([...customEvents, ...seedEvents]),
    [customEvents, seedEvents]
  );

  const visible = useMemo(
    () => filterEvents(allEvents, filters, statusMap),
    [allEvents, filters, statusMap]
  );

  const grouped = useMemo(() => groupEventsByDay(visible), [visible]);

  const setStatus = (eventId: string, status: EventStatus) => {
    setStatusMap((prev) => {
      const next: StatusMap = { ...prev };
      const record: EventStatusRecord = {
        eventId,
        status,
        notes: prev[eventId]?.notes,
        updatedAt: new Date().toISOString(),
      };
      next[eventId] = record;
      return next;
    });
  };

  const deleteCustom = (id: string) => {
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
    setStatusMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const openEvent = openId
    ? allEvents.find((e) => e.id === openId) ?? null
    : null;

  return (
    <div className="space-y-8">
      {/* Hero ----------------------------------------------------------- */}
      <section className="relative overflow-hidden rounded-3xl border border-[color:var(--hairline)] bg-teal-900 px-6 py-10 text-sand-50 sm:px-10 sm:py-16 lg:py-20">
        {/* Aerial Croisette photo backdrop */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/walkthrough-bg.jpg)" }}
          aria-hidden
        />
        {/* Legibility scrim: dark at the bottom-left where headline + buttons
            live, lighter at the top-right where the photo is most beautiful */}
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(10,46,44,0.78)_0%,rgba(10,46,44,0.55)_45%,rgba(10,46,44,0.15)_100%)]"
          aria-hidden
        />
        <div className="relative">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
            Your <span className="text-coral-500">command center</span> for Cannes Lions 2026.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-sand-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-base">
            Discover beach clubs, parties, panels, and yacht dinners. Track which
            ones you&apos;re registered for. Add your own meetings. See who else is
            on the Croisette. Your data stays in your browser. Nothing is sent
            to us.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#events"
              className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white hover:bg-coral-600"
            >
              Browse events
            </a>
          </div>
        </div>
      </section>

      {/* Extension install CTA (Chromium only, dismissible) -------------- */}
      <ExtensionBanner />

      {/* Stats ---------------------------------------------------------- */}
      <section id="events" className="space-y-4">
        <DashboardStats events={allEvents} statusMap={statusMap} />
      </section>

      {/* Filters -------------------------------------------------------- */}
      <EventFilters
        filters={filters}
        setFilters={setFilters}
        totalCount={allEvents.length}
        visibleCount={visible.length}
      />

      {/* Grid / grouped ------------------------------------------------- */}
      {visible.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No events match these filters"
          description="Try widening the date range, clearing categories, or removing a status filter."
        />
      ) : (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.dayKey}>
              <div className="mb-4 flex items-end justify-between gap-3 border-b border-[color:var(--hairline)] pb-2">
                <h2 className="flex items-baseline gap-3 font-display text-2xl font-semibold text-teal-900">
                  <Calendar className="h-4 w-4 self-center text-teal-700" />
                  {group.label}
                </h2>
                <span className="text-[12px] uppercase tracking-widest text-[color:var(--muted)]">
                  {group.events.length}{" "}
                  {group.events.length === 1 ? "event" : "events"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.events.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    status={resolveStatus(e, statusMap)}
                    onOpen={() => setOpenId(e.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <EventDetailDialog
        event={openEvent}
        open={!!openEvent}
        onOpenChange={(o) => !o && setOpenId(null)}
        statusMap={statusMap}
        setStatus={setStatus}
        onDeleteCustom={(id) => deleteCustom(id)}
      />
    </div>
  );
}
