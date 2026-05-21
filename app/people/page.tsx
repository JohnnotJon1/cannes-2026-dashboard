import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { PeopleExplorer } from "@/components/people-explorer";
import { seedPeople } from "@/lib/seed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Who's going to Cannes 2026",
  description:
    "Public signals from people heading to Cannes Lions 2026. Curated from official Cannes Lions announcements and public LinkedIn / X posts. No private data, no emails.",
};

export default function PeoplePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Who&apos;s going to Cannes this year.
          </h1>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-[14px] font-semibold text-sand-50 hover:bg-teal-800"
          >
            <UserPlus className="h-4 w-4" />
            Going? Add yourself
          </Link>
        </div>

        {/* useSearchParams() inside PeopleExplorer requires Suspense at the
            static-generation boundary. */}
        <Suspense fallback={null}>
          <PeopleExplorer people={seedPeople} />
        </Suspense>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-sand-100 px-5 py-4 text-[13px] leading-relaxed text-[color:var(--ink-soft)]">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <div>
              <p>
                <strong className="text-teal-900">Sourced from public posts.</strong>{" "}
                Every entry above comes from an official Cannes Lions
                announcement, a public LinkedIn / X post, or a public conference
                attendee listing. No email addresses, no scraped private
                profiles, nothing that isn&apos;t already public. Each card
                links to the source.
              </p>
              <p className="mt-2">
                <strong className="text-teal-900">Want to be removed?</strong>{" "}
                Email{" "}
                <a
                  href="mailto:john@airpost.ai?subject=Cannes%202026%20dashboard%20%E2%80%94%20remove%20me%20from%20people%20feed"
                  className="font-medium text-teal-700 underline-offset-2 hover:underline"
                >
                  john@airpost.ai
                </a>{" "}
                with your name and a link to your LinkedIn. We&apos;ll remove
                you from the feed and add you to the blocklist so future
                refreshes skip you.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
