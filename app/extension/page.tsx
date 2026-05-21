import {
  Wand2,
  ShieldCheck,
  Download,
  Lock,
  Sparkles,
  Code2,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chrome extension",
  description:
    "Install the free companion Chrome extension to auto-fill your name, email, company, and title on every Cannes Lions 2026 RSVP form. Privacy-first. No accounts.",
};

export default function ExtensionPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            <Wand2 className="h-3.5 w-3.5" />
            Chrome extension
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Real auto-fill, one click away.
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            Install our free Chrome extension and every Cannes Lions 2026 RSVP
            form gets your name, email, company, and title pre-populated the
            moment the page loads. You review, solve any captcha, and click
            submit yourself. We never see your data.
          </p>
        </section>

        <section className="rounded-2xl border border-coral-500/30 bg-coral-100/30 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-teal-900">
                Install the extension
              </h2>
              <p className="mt-1 max-w-md text-[13.5px] text-[color:var(--ink-soft)]">
                One-click install from the Chrome Web Store. Free. No account
                required.
              </p>
            </div>
            <a
              href="#install-options"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-coral-500 px-5 py-2.5 text-sm font-semibold text-teal-900 shadow-[0_8px_24px_-12px_rgba(184,137,90,0.7)] transition-colors hover:bg-coral-600"
            >
              <Download className="h-4 w-4" />
              Install
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-teal-700/30 bg-teal-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-800 text-sand-50">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-teal-900">
                The privacy contract
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-teal-900">
                <li>The extension only reads your profile from your Cannes 2026 dashboard&apos;s origin. Nothing else.</li>
                <li>It only fills forms on Cannes event domains explicitly listed in its manifest. No other site can request your data.</li>
                <li>Your profile stays in your browser&apos;s extension storage. It is never sent over the network.</li>
                <li>The extension never submits forms on your behalf. You always click submit yourself.</li>
                <li>No analytics, no telemetry, no tracking.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4" id="install-options">
          <h2 className="font-display text-2xl font-semibold text-teal-900">
            Two ways to install
          </h2>

          <div className="rounded-2xl border border-[color:var(--hairline)] bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-sand-100 text-teal-800">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="font-display text-lg font-semibold text-teal-900">
                Chrome Web Store
              </h3>
            </div>
            <p className="mt-3 text-[13.5px] text-[color:var(--ink-soft)]">
                Coming soon. The extension is in submission to the store and
                takes Google a few weeks to review. We&apos;ll put the install
                link here as soon as it&apos;s live.
            </p>
          </div>

          <div className="rounded-2xl border border-[color:var(--hairline)] bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-sand-100 text-teal-800">
                <Code2 className="h-4 w-4" />
              </span>
              <h3 className="font-display text-lg font-semibold text-teal-900">
                For developers: load unpacked
              </h3>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
              The extension source lives in the <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">extension/</code> folder
              of this project. To load it locally before the store listing is live:
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-[color:var(--ink-soft)]">
              <li>Open <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">chrome://extensions</code></li>
              <li>Toggle <strong>Developer mode</strong> on (top right)</li>
              <li>Click <strong>Load unpacked</strong></li>
              <li>Select the <code className="rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px]">extension/</code> folder from this project</li>
              <li>Reload this page — the install banner will disappear and your profile will sync automatically</li>
            </ol>
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--hairline)] bg-sand-100 px-5 py-4 text-[13px] text-[color:var(--ink-soft)]">
          <p className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            <span>
              <strong className="text-teal-900">Don&apos;t want the extension?</strong>{" "}
              The dashboard&apos;s built-in <em>Register me</em> button still
              works without it. You&apos;ll get one-click copy chips for every
              profile field instead of true auto-fill.
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}

