import { Users, Sparkles, ShieldAlert } from "lucide-react";
import { PeopleExplorer } from "@/components/people-explorer";
import { LastUpdated } from "@/components/last-updated";
import { seedPeople, refreshMetadata } from "@/lib/seed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Who's going to Cannes 2026",
  description:
    "Publicly-shared signals from people heading to Cannes Lions 2026. No private data, no scraping, no emails.",
};

export default function PeoplePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            <Users className="h-3.5 w-3.5" />
            People signal
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Who&apos;s going to Cannes this year.
          </h1>
          <p className="max-w-3xl text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            A timeline of people who have publicly said they&apos;re heading to the Croisette.
            Surface signals from LinkedIn posts, public tweets, and conference attendee lists —
            then DM them or drop into a session where they&apos;re speaking.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <LastUpdated
              iso={refreshMetadata.people.lastUpdated}
              count={refreshMetadata.people.count}
              noun="people"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-coral-500/40 bg-coral-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-coral-600">
              <Sparkles className="h-3 w-3" /> Sample data
            </span>
          </div>
        </section>

        <PeopleExplorer people={seedPeople} />

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-sand-100 px-5 py-4 text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <div>
              <p>
                <strong className="text-teal-900">Sample data, by design.</strong>{" "}
                The entries above are illustrative — they show what the People view will look like
                once the public-signal ingestion ships. Future versions will surface real signals
                from public posts on LinkedIn, X, and conference sites. We&apos;ll never include
                email addresses, scrape private profiles, or expose anything that isn&apos;t
                already public.
              </p>
              <p className="mt-2">
                Want to be included once it&apos;s live? Post publicly that you&apos;re going to
                Cannes 2026 — that&apos;s the only signal we look at.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
