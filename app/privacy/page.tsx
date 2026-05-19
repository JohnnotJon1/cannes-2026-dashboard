import {
  ShieldCheck,
  Lock,
  HardDrive,
  Globe,
  Wand2,
  XCircle,
  Mail,
  Code2,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How the Cannes 2026 dashboard and Chrome extension handle your data. The short version: nothing leaves your browser. The long version is on this page.",
};

const DASHBOARD_DOMAIN = "cannes.airpost.ai";
const CONTACT_EMAIL = "john@airpost.ai";
const REPO_URL = "https://github.com/ReadySetCo/cannes-2026-dashboard";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Privacy
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Nothing leaves your browser.
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            This is a static website. There is no backend, no database, no
            login, no analytics, no tracking. Your profile, your registration
            statuses, your notes — all of it lives in your browser&apos;s
            local storage and never gets sent anywhere. The author of this site
            cannot see your data because there is no place for it to land.
          </p>
        </section>

        <section className="rounded-2xl border border-teal-700/30 bg-teal-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-800 text-sand-50">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-teal-900">
                The whole privacy posture in 5 bullets
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-teal-900">
                <li>Your profile and event statuses live in this browser&apos;s <code className="rounded bg-white/60 px-1 py-0.5 text-[12.5px]">localStorage</code>. Nowhere else.</li>
                <li>No analytics. No tracking pixels. No third-party cookies. No fingerprinting.</li>
                <li>The Chrome extension only reads from <code className="rounded bg-white/60 px-1 py-0.5 text-[12.5px]">{DASHBOARD_DOMAIN}</code>. It cannot read from any other site.</li>
                <li>The extension never submits forms for you. You always click submit yourself.</li>
                <li>The code is open source under MIT. Audit it: <a href={REPO_URL} className="underline" target="_blank" rel="noopener noreferrer">{REPO_URL.replace("https://", "")}</a>.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-teal-700" />
            <h2 className="font-display text-2xl font-semibold text-teal-900">
              What gets stored in your browser
            </h2>
          </div>
          <p className="text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            All under versioned <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">ccc:v1:*</code> keys in your browser&apos;s localStorage. Open DevTools → Application → Local Storage and you can see and clear it yourself any time.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Item
              term="ccc:v1:profile"
              desc="Your name, email, company, title, LinkedIn URL, and phone. Used to pre-fill RSVP forms."
            />
            <Item
              term="ccc:v1:statuses"
              desc="Which events you marked Registered, Pending, Action-needed, Attended, or Skipped."
            />
            <Item
              term="ccc:v1:customEvents"
              desc="Events you added yourself (dinners, meetings, anything not in the public seed)."
            />
            <Item
              term="ccc:v1:onboarding-completed"
              desc="Whether you finished the first-visit walkthrough. So we don't show it again."
            />
            <Item
              term="ccc:v1:privacy-banner-dismissed"
              desc="Whether you've dismissed the privacy banner. So we don't keep showing it."
            />
            <Item
              term="ccc:v1:extension-banner-dismissed"
              desc="Whether you've dismissed the install-the-extension banner."
            />
          </dl>
          <p className="text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            Clear localStorage in DevTools and your data is gone — there&apos;s no backup, no server copy, no way to recover it. That&apos;s the price of the privacy story.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-teal-700" />
            <h2 className="font-display text-2xl font-semibold text-teal-900">
              What gets shipped in the public dataset
            </h2>
          </div>
          <p className="text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            Two JSON files in the open-source repo, visible to everyone:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            <li>
              <strong className="text-teal-900">
                <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">data/events.json</code>
              </strong>{" "}
              — the curated Cannes Lions 2026 event directory. Sourced from publicly-listed registration pages. Update via pull request.
            </li>
            <li>
              <strong className="text-teal-900">
                <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">data/people.json</code>
              </strong>{" "}
              — the &quot;Who&apos;s going&quot; feed. Each card is sourced from a public LinkedIn post, X post, or official Cannes Lions announcement, with a link back to the original. Every entry is on a person who publicly posted about their attendance — never private profiles, never private data.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-teal-700" />
            <h2 className="font-display text-2xl font-semibold text-teal-900">
              The Chrome extension
            </h2>
          </div>
          <p className="text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            Optional companion. Reads your saved profile from this dashboard and fills it into Cannes event RSVP forms automatically.
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            <li><strong className="text-teal-900">What it reads:</strong> only <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">ccc:v1:profile</code> from <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">{DASHBOARD_DOMAIN}</code>. Nothing else, no other origin.</li>
            <li><strong className="text-teal-900">What it writes:</strong> form fields on the specific Cannes event domains listed in its manifest. The full domain list is public in <a href={`${REPO_URL}/blob/main/extension/manifest.json`} className="underline" target="_blank" rel="noopener noreferrer">extension/manifest.json</a>.</li>
            <li><strong className="text-teal-900">What it stores:</strong> a local copy of your profile in the extension&apos;s own Chrome storage, so it can fill forms even when the dashboard tab isn&apos;t open. This copy is also browser-local — it never leaves your machine.</li>
            <li><strong className="text-teal-900">What it never does:</strong> submit forms for you, contact a server, run analytics, send telemetry, or read from any domain not in its manifest. You always click submit yourself.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-teal-700" />
            <h2 className="font-display text-2xl font-semibold text-teal-900">
              What we don&apos;t do
            </h2>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
            <li>No accounts. No sign-ups. No passwords stored anywhere.</li>
            <li>No analytics (no Google Analytics, no Plausible, no Posthog, no Mixpanel).</li>
            <li>No cookies, with one exception: a single dismiss-the-privacy-banner flag.</li>
            <li>No newsletter sign-up. No retargeting pixels. No ad networks.</li>
            <li>No server logs of your personal data — because nothing personal is sent to a server.</li>
            <li>No share-with-partners. No data brokering. There is no &quot;data&quot; to share or broker.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-coral-500/30 bg-coral-100/30 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-coral-500 text-white">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-teal-900">
                Takedowns &amp; questions
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
                If you&apos;re on the <Link href="/people" className="underline">Who&apos;s going</Link> feed and want to be removed, email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-teal-900 underline">
                  {CONTACT_EMAIL}
                </a>{" "}
                — or open an issue using the{" "}
                <a
                  href={`${REPO_URL}/issues/new?template=takedown-request.yml`}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  takedown request template
                </a>
                . We&apos;ll remove the entry from <code className="rounded bg-white/60 px-1 py-0.5 text-[12.5px]">data/people.json</code> and add your URL to the blocklist so future scrape refreshes skip you.
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
                Other privacy questions? Same address.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-sand-100 p-5">
          <div className="flex items-start gap-3">
            <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
            <div>
              <h2 className="font-semibold text-teal-900">Audit the code</h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
                Don&apos;t take our word for it. The entire site + extension is MIT-licensed and lives at{" "}
                <a href={REPO_URL} className="underline" target="_blank" rel="noopener noreferrer">
                  github.com/ReadySetCo/cannes-2026-dashboard
                </a>
                . Open DevTools and watch the Network tab while you click around — you&apos;ll see no calls except the initial page load.
              </p>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 text-[12px] text-[color:var(--muted)]">
          <Lock className="h-3.5 w-3.5" />
          Last updated: 18 May 2026
        </p>
      </div>
    </div>
  );
}

function Item({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-3">
      <dt className="font-mono text-[12px] text-teal-800">{term}</dt>
      <dd className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--ink-soft)]">
        {desc}
      </dd>
    </div>
  );
}
