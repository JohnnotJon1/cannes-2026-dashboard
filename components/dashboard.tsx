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

  const grouped = useMemo(() => {
    // When a specific day is picked, collapse the per-day grouping
    // into one section with the SELECTED day's label. Multi-day events
    // that overlap that day will appear here instead of under their
    // (potentially earlier) start date — fixes the confusing case
    // where picking "Tue 23" still showed all-week events under a
    // "Sunday, June 21" heading.
    if (filters.dateRange === "all") {
      return groupEventsByDay(visible);
    }
    const d = new Date(filters.dateRange + "T12:00:00Z");
    const label = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    return [{ dayKey: filters.dateRange, label, events: visible }];
  }, [visible, filters.dateRange]);

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
      {/* Search --------------------------------------------------------- */}
      <div id="events">
        <EventFilters filters={filters} setFilters={setFilters} />
      </div>

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
