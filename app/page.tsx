import { Dashboard } from "@/components/dashboard";
import { seedEvents } from "@/lib/seed";

export default function HomePage() {
  return (
    <>
      {/* Full-bleed Croisette hero — edge-to-edge across the viewport. */}
      <section className="relative isolate overflow-hidden bg-teal-900 text-sand-50">
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
        <div className="relative mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-5 py-12 lg:px-8 lg:py-20">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
            The ultimate <span className="text-coral-500">prep site</span> for Cannes 2026.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-sand-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)] sm:text-base">
            See who&apos;s going and register for every possible party and event.
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

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <Dashboard seedEvents={seedEvents} />
      </div>
    </>
  );
}
