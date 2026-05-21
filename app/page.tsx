import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Dashboard } from "@/components/dashboard";
import { PeopleExplorer } from "@/components/people-explorer";
import { seedEvents, seedPeople } from "@/lib/seed";
import { showEvents } from "@/lib/features";

export default function HomePage() {
  return (
    <>
      {/* Full-bleed Croisette hero — edge-to-edge AND top-to-top.
          The -mt-[68px] pulls the section up under the sticky header
          (which is ~68px tall) so the photo backdrop reaches the very
          top of the viewport. Inner pt-* compensates so the headline
          doesn't slide under the header. */}
      <section className="relative isolate -mt-[68px] overflow-hidden bg-teal-900 text-sand-50">
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
        <div className="relative mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-5 pb-12 pt-24 lg:px-8 lg:pb-20 lg:pt-32">
          {showEvents ? (
            <>
              <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
                The ultimate <span className="text-coral-500">prep site</span> for Cannes 2026.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-sand-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-base">
                See who&apos;s going and register for every possible party and event.
              </p>
            </>
          ) : (
            <>
              <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
                Who&apos;s going to <span className="text-coral-500">Cannes 2026</span>?
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-sand-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-base">
                A live directory of advertising people heading to the festival. Find your network, add yourself, plan the meet-ups.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="#people"
                  className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-6 py-3 text-[15px] font-semibold text-teal-900 shadow-lg shadow-black/20 transition hover:bg-coral-400"
                >
                  See who&apos;s going <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 rounded-full border border-sand-50/40 bg-white/10 px-6 py-3 text-[15px] font-semibold text-sand-50 backdrop-blur-sm transition hover:bg-white/20"
                >
                  Add yourself
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {showEvents ? (
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Dashboard seedEvents={seedEvents} />
        </div>
      ) : (
        <section
          id="people"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-10 lg:px-8 lg:py-14"
        >
          {/* PeopleExplorer uses useSearchParams() so we wrap in Suspense
              to satisfy Next 15+'s static-generation boundary requirement. */}
          <Suspense fallback={null}>
            <PeopleExplorer people={seedPeople} />
          </Suspense>
        </section>
      )}
    </>
  );
}
