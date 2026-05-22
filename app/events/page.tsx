import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { seedEvents } from "@/lib/seed";
import { showEvents } from "@/lib/features";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Open-registration events at Cannes Lions 2026 — beach clubs, panels, parties, brunches. Register in one click.",
};

export default function EventsPage() {
  // Public deploy (events flag off) shows ONLY the cleanly-promotable subset:
  // events whose organizer is already publicly marketing them via an open
  // registration form (Splash That, Luma, Eventbrite, Cvent, canneslions.com).
  // Private deploy gets the full event list for John's own planning.
  const events = showEvents
    ? seedEvents
    : seedEvents.filter((e) => e.registrationType === "open");

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <Dashboard seedEvents={events} />
    </div>
  );
}
