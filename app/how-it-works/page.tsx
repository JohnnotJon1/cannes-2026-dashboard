import {
  Compass,
  ListChecks,
  Plus,
  Users,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "What this dashboard does, what's real today, and what data is stored where. Non-technical.",
};

const SECTIONS = [
  {
    Icon: Compass,
    title: "What this is",
    body: (
      <>
        <p>
          A single dashboard for navigating Cannes Lions 2026: beach clubs,
          parties, panels, yacht dinners, and the 1,100+ fringe events on the
          Propeller list.
        </p>
        <p>
          It&apos;s designed for first-timers who don&apos;t know where to start, and veterans who want
          a saner way to track which lists they&apos;re on and what they still need to act on.
        </p>
      </>
    ),
  },
  {
    Icon: ListChecks,
    title: "How statuses work",
    body: (
      <>
        <p>Every event has a status. You can change it at any time on the event card.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Registered</strong>: you&apos;re on the list.</li>
          <li><strong>Pending</strong>: RSVP submitted, waiting on confirmation.</li>
          <li><strong>Action needed</strong>: you still need to do something (email a rep, submit a form).</li>
          <li><strong>Not registered</strong>: you don&apos;t intend to attend.</li>
          <li><strong>Attended</strong> / <strong>Skipped</strong>: for after the fact.</li>
        </ul>
      </>
    ),
  },
  {
    Icon: Plus,
    title: "Adding your own events",
    body: (
      <>
        <p>
          The seed list covers the major public events. Use{" "}
          <span className="font-medium">Add event</span> on the dashboard to track invite-only
          dinners, custom meetings, or any third-party event from the Propeller list.
        </p>
        <p>
          Custom events show up alongside seeded ones with a <em>Your event</em> tag. They&apos;re
          stored in your browser only.
        </p>
      </>
    ),
  },
  {
    Icon: Users,
    title: "Who's going",
    body: (
      <>
        <p>
          The <Link href="/people" className="font-medium text-teal-700 hover:text-teal-900">Who&apos;s going</Link>{" "}
          page is a timeline of people who have publicly said they&apos;re heading
          to the festival, based on public LinkedIn posts, tweets, and
          conference-attendee announcements.
        </p>
        <p>
          For the MVP, this tab is populated with <strong>sample data</strong> so you can see the
          shape. Real public-signal ingestion ships in a follow-up. No email addresses, no
          private connections, no scraping anything that isn&apos;t already public.
        </p>
      </>
    ),
  },
  {
    Icon: ShieldCheck,
    title: "What data is stored, and where",
    body: (
      <>
        <p>Two tiers:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Public, ships with the app:</strong> the event list and the people timeline. These
            are in a JSON file in the repo. Anyone can see them.
          </li>
          <li>
            <strong>Private, stays in your browser:</strong> your profile, your event statuses,
            your custom events, your notes. Stored in your browser&apos;s{" "}
            <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">localStorage</code>{" "}
            under <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">ccc:v1:*</code> keys.
            Nothing is sent to a server.
          </li>
        </ul>
        <p>
          That means the site owner literally can&apos;t see your data. If you open
          DevTools and clear <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">localStorage</code>,
          everything personal vanishes.
        </p>
      </>
    ),
  },
  {
    Icon: HelpCircle,
    title: "FAQ",
    body: (
      <>
        <p><strong>Is this affiliated with Cannes Lions?</strong> No. It&apos;s an open community tool.</p>
        <p><strong>What if I clear my browser?</strong> Your statuses and profile go with it. Treat this like Notes, not a cloud doc.</p>
        <p><strong>Can I share it?</strong> Yes. Send the URL to anyone heading to Cannes. The seed event list is public; their personal data stays on their device.</p>
        <p><strong>Found a missing event?</strong> Open the GitHub repo and submit a PR to{" "}
          <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">data/events.json</code>, or add it
          as a custom event for yourself.</p>
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            <HelpCircle className="h-3.5 w-3.5" />
            How it works
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            The 5-minute orientation.
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            This dashboard is built to be obvious, but here&apos;s a tour anyway,
            including the things that are real today and the things we&apos;re
            still building.
          </p>
        </section>

        <div className="space-y-5">
          {SECTIONS.map((s) => (
            <section
              key={s.title}
              className="rounded-2xl border border-[color:var(--hairline)] bg-white p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand-100 text-teal-800">
                  <s.Icon className="h-5 w-5" />
                </span>
                <div className="space-y-2.5 text-[14.5px] leading-relaxed text-[color:var(--ink)]">
                  <h2 className="font-display text-xl font-semibold text-teal-900">
                    {s.title}
                  </h2>
                  {s.body}
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-coral-500/30 bg-coral-100/40 px-5 py-4 text-[13px] text-teal-900">
          <p>
            <strong>Want a feature?</strong> Open an issue on the repo or DM
            the maintainer. This is meant to be a useful community tool, not a
            polished SaaS. Opinionated, fast to ship, and easy to fork.
          </p>
        </section>
      </div>
    </div>
  );
}
