import { Mail, CalendarDays, ShieldCheck, Plug, Hourglass } from "lucide-react";
import type { Metadata } from "next";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.78C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.78 24h20.44C23.2 24 24 23.22 24 22.26V1.74C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Optional integrations for Cannes Command Center — Gmail, Google Calendar, LinkedIn. Built privacy-first.",
};

type IntegrationIcon = (props: { className?: string }) => React.ReactNode;

type Integration = {
  key: string;
  name: string;
  Icon: IntegrationIcon;
  status: "coming-soon";
  what: string;
  why: string;
  privacy: string;
};

const INTEGRATIONS: Integration[] = [
  {
    key: "gmail",
    name: "Gmail",
    Icon: ({ className }) => <Mail className={className} />,
    status: "coming-soon",
    what: "Once connected, the app reads only confirmation emails matching your saved event registrations — and updates your statuses (registered, waitlisted, action needed) automatically.",
    why: "Stops the daily inbox-scrubbing for ‘did Microsoft confirm yet?’.",
    privacy:
      "Uses your own Google account. Tokens stay in an encrypted session cookie on your browser. Email subject lines are matched client-side; nothing is stored on a server we can read.",
  },
  {
    key: "gcal",
    name: "Google Calendar",
    Icon: ({ className }) => <CalendarDays className={className} />,
    status: "coming-soon",
    what: "One-click ‘add to my calendar’ for any registered event. Pulls invite details from registration confirmations.",
    why: "No more re-typing dates from confirmation emails into your calendar.",
    privacy:
      "Adds events to your own Google Calendar via OAuth. We never see your other calendar entries.",
  },
  {
    key: "linkedin",
    name: "LinkedIn (public signal)",
    Icon: ({ className }) => <LinkedInIcon className={className} />,
    status: "coming-soon",
    what: "Optional discovery layer for the Who's going timeline. Indexes public posts mentioning Cannes attendance.",
    why: "Find people in your network who are quietly heading to the Croisette.",
    privacy:
      "Only public LinkedIn posts. No private messages. No connection graph. No email scraping. Aligned to LinkedIn’s public terms.",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-7">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            <Plug className="h-3.5 w-3.5" />
            Integrations
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Optional connections — coming soon.
          </h1>
          <p className="max-w-3xl text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            Today, Cannes Command Center is fully local-first — no integrations are required to
            use it. These optional connections are on the roadmap. When they ship, they&apos;ll
            authenticate against <strong>your</strong> accounts directly, with tokens stored
            in your browser. The site owner will never see your inbox or calendar.
          </p>
        </section>

        <section className="rounded-2xl border border-teal-700/30 bg-teal-100 p-5 text-[14px] text-teal-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-semibold">The privacy contract</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed">
                <li>You authenticate against your own Google / LinkedIn account.</li>
                <li>Tokens live in an encrypted session cookie scoped to this browser.</li>
                <li>We do not run a database that stores your messages, contacts, or calendar.</li>
                <li>You can disconnect any integration in one click. Disconnecting purges its data.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {INTEGRATIONS.map((i) => (
            <article
              key={i.key}
              className="flex flex-col gap-3 rounded-2xl border border-[color:var(--hairline)] bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-sand-100 text-teal-800">
                    <i.Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-lg font-semibold text-teal-900">
                    {i.name}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-amber-600">
                  <Hourglass className="h-3 w-3" />
                  Coming soon
                </span>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
                  What it does
                </div>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
                  {i.what}
                </p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
                  Why
                </div>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
                  {i.why}
                </p>
              </div>
              <div className="rounded-lg border border-[color:var(--hairline)] bg-sand-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-teal-900">
                <strong className="font-semibold">Privacy: </strong>
                {i.privacy}
              </div>
              <button
                type="button"
                disabled
                className="mt-auto rounded-full border border-[color:var(--hairline)] bg-sand-100 px-3.5 py-1.5 text-[13px] font-medium text-[color:var(--muted)]"
                title="Coming soon"
              >
                Connect (coming soon)
              </button>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-sand-100 px-5 py-4 text-[13px] text-[color:var(--ink-soft)]">
          <p>
            <strong className="text-teal-900">Today&apos;s scope.</strong> The MVP is intentionally
            integration-free. Marking events registered, taking notes, adding your own dinners,
            and saving your profile all work without any account. We&apos;ll layer integrations
            on top, not under, the local-first base.
          </p>
        </section>
      </div>
    </div>
  );
}
