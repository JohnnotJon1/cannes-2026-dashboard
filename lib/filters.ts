import type {
  AnyEvent,
  EventCategory,
  EventStatus,
  StatusMap,
} from "@/types";

export interface FilterState {
  search: string;
  categories: EventCategory[];
  statuses: EventStatus[];
  /**
   * Either "all" or an ISO date key in YYYY-MM-DD form (UTC). When a
   * date is selected, an event is shown if its [startDate, endDate]
   * range includes that day — so multi-day events appear under every
   * day they cover.
   */
  dateRange: string;
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  categories: [],
  statuses: [],
  dateRange: "all",
};

function utcDayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")}`;
}

export function resolveStatus(
  event: AnyEvent,
  statusMap: StatusMap
): EventStatus {
  const override = statusMap[event.id]?.status;
  if (override) return override;
  return event.defaultStatus ?? "not-registered";
}

export function filterEvents(
  events: AnyEvent[],
  filters: FilterState,
  statusMap: StatusMap
): AnyEvent[] {
  return events.filter((event) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        event.name,
        event.organizer,
        event.location,
        event.description,
        ...(event.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.categories.length && !filters.categories.includes(event.category)) {
      return false;
    }
    if (filters.statuses.length) {
      const status = resolveStatus(event, statusMap);
      if (!filters.statuses.includes(status)) return false;
    }
    if (filters.dateRange !== "all") {
      const start = new Date(event.startDate);
      const end = event.endDate ? new Date(event.endDate) : start;
      const startKey = utcDayKey(start);
      const endKey = utcDayKey(end);
      const pick = filters.dateRange;
      // Multi-day events show on every day they overlap.
      if (pick < startKey || pick > endKey) return false;
    }
    return true;
  });
}

export function sortEventsByDate(events: AnyEvent[]): AnyEvent[] {
  return [...events].sort(
    (a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

export function groupEventsByDay(events: AnyEvent[]): {
  dayKey: string;
  label: string;
  events: AnyEvent[];
}[] {
  const groups = new Map<string, AnyEvent[]>();
  for (const e of events) {
    const d = new Date(e.startDate);
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, dayEvents]) => {
      const d = new Date(dayKey + "T12:00:00Z");
      const label = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      });
      return { dayKey, label, events: dayEvents };
    });
}

export function formatEventDateTime(event: AnyEvent): string {
  const d = new Date(event.startDate);
  const datePart = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const hasTime =
    d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0;
  if (!hasTime) return datePart;
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${datePart} · ${timePart}`;
}
