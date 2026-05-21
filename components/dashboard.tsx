"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import type {
  AnyEvent,
  CannesEvent,
  CustomEvent,
  EventStatus,
  EventStatusRecord,
  StatusMap,
  UserProfile,
} from "@/types";
import { EMPTY_PROFILE } from "@/types";
import { STORAGE_KEYS, useLocalStorage } from "@/lib/storage";
import {
  DEFAULT_FILTERS,
  filterEvents,
  sortEventsByDate,
  type FilterState,
} from "@/lib/filters";
import { EventCard } from "./event-card";
import { EventFilters } from "./event-filters";
import { EventDetailDialog } from "./event-detail-dialog";
import { EmptyState } from "./empty-state";

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
  const [profile] = useLocalStorage<UserProfile>(
    STORAGE_KEYS.profile,
    EMPTY_PROFILE
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
    <div className="space-y-4">
      {/* Search --------------------------------------------------------- */}
      <div id="events">
        <EventFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Grid (flat, chronological) ------------------------------------ */}
      {visible.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No events match these filters"
          description="Try clearing the search and trying again."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              profile={profile}
              onOpen={() => setOpenId(e.id)}
            />
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
