import {
  Wand2,
  ShieldCheck,
  Plug,
  ListChecks,
  Users,
  Puzzle,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { RestartSetupButton } from "@/components/restart-setup-button";

export const metadata: Metadata = {
  title: "How registration works",
  description:
    "How your Cannes Lions 2026 dashboard pre-fills RSVP forms with your saved info. No accounts, no integrations, no surprises.",
};

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-7">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            <Plug className="h-3.5 w-3.5" />
            How it works
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            No connections needed. Ever.
          </h1>
          <p className="max-w-3xl text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            This dashboard does its job without asking you to connect Gmail,
            Google Calendar, or anything else. Here&apos;s how each feature
            actually works under the hood.
          </p>
          <div className="pt-1">
            <RestartSetupButton />
          </div>
        </section>

        <section className="rounded-2xl border border-teal-700/30 bg-teal-100 p-5 text-[14px] text-teal-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-semibold">
                The privacy contract
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px] leading-relaxed">
                <li>Your profile is saved to your browser&apos;s localStorage. It never leaves your device.</li>
                <li>No account creation. No password. No OAuth.</li>
                <li>We don&apos;t submit forms on your behalf. You always click submit yourself.</li>
                <li>Clear your browser storage and everything personal is gone instantly.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border-2 border-coral-500/40 bg-gradient-to-br from-coral-100/40 via-sand-100 to-sand-50 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-800 text-sand-50">
                <Puzzle className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-teal-900">
                    Chrome extension companion
                  </h2>
                  <span className="rounded-full border border-coral-500/40 bg-coral-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-coral-600">
                    Free
                  </span>
                </div>
                <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
                  Install once and every Cannes RSVP form auto-fills with your
                  saved info. No more typing, no copy-pasting. You still click
                  submit yourself.
                </p>
              </div>
            </div>
            <Link
              href="/extension"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-coral-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_6px_18px_-10px_rgba(214,90,58,0.7)] transition-colors hover:bg-coral-600"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Install extension
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <FeatureCard
            Icon={Wand2}
            title="Register me"
            what="Click Register me on any event. We open the RSVP form in a new tab with as many fields pre-filled as the form supports (name, email, company, title). For forms that don&apos;t support URL pre-fill, we surface click-to-copy chips so you can paste each field with one click."
            why="Skips the most annoying part of conference prep: typing the same six fields into 30 different forms."
          />
          <FeatureCard
            Icon={ListChecks}
            title="Status tracking"
            what="After you submit a form, come back and click I&apos;m in to mark it Registered. Everything you tag stays in your browser. Filter the dashboard by status to see what&apos;s confirmed, what&apos;s pending, and what still needs action."
            why="One place to track every event you&apos;ve gone after, instead of a spreadsheet you forget to update."
          />
          <FeatureCard
            Icon={Users}
            title="Who&apos;s going"
            what="Endless feed of people publicly posting on LinkedIn and X about attending Cannes 2026 (and who attended last year). One click takes you to their profile."
            why="Find people in your network who are quietly heading to the Croisette so you can reach out before the rush."
            sample
          />
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-sand-100 px-5 py-4 text-[13px] text-[color:var(--ink-soft)]">
          <p>
            <strong className="text-teal-900">Future enhancements:</strong> a
            real auto-registration agent (server-side form submission for the
            events with simple forms), real public-signal ingestion of LinkedIn
            and X posts via a daily Apify scrape, and one-click calendar
            export. All optional, all designed so your data still stays in your
            browser.
          </p>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  Icon,
  title,
  what,
  why,
  sample,
}: {
  Icon: (p: { className?: string }) => React.ReactNode;
  title: string;
  what: string;
  why: string;
  sample?: boolean;
}) {
  const renderWithApos = (s: string) => s.replace(/&apos;/g, "’");
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[color:var(--hairline)] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sand-100 text-teal-800">
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="font-display text-lg font-semibold text-teal-900">
            {renderWithApos(title)}
          </h3>
        </div>
        {sample && (
          <span className="inline-flex items-center gap-1 rounded-full border border-coral-500/40 bg-coral-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-coral-600">
            Sample data today
          </span>
        )}
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
          What it does
        </div>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
          {renderWithApos(what)}
        </p>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
          Why
        </div>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
          {renderWithApos(why)}
        </p>
      </div>
    </article>
  );
}
