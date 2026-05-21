import Link from "next/link";
import { Lock } from "lucide-react";
import { showEvents } from "@/lib/features";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[color:var(--hairline)] bg-sand-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-teal-900">
            Cannes Lions 2026
          </span>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[color:var(--muted)]">
            A privacy-first companion for Cannes Lions 2026. Discover events,
            track your status, see who&apos;s going.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-800">
            Explore
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            {showEvents && (
              <li><Link className="hover:text-teal-700" href="/">Events</Link></li>
            )}
            <li><Link className="hover:text-teal-700" href="/people">Who&apos;s going</Link></li>
            {showEvents && (
              <li><Link className="hover:text-teal-700" href="/profile">Your profile</Link></li>
            )}
            <li><Link className="hover:text-teal-700" href="/contact">Support</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-800">
            Privacy
          </h4>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Your profile and event statuses live in this browser&apos;s{" "}
            <span className="font-medium text-teal-900">localStorage</span>.
            They&apos;re never sent to a server. We can&apos;t see them.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-white/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-teal-800">
              <Lock className="h-3 w-3" />
              Local only
            </span>
            <Link
              href="/privacy"
              className="text-[12px] font-medium text-teal-800 underline-offset-2 hover:text-teal-900 hover:underline"
            >
              Full privacy policy →
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-800">
            Festival
          </h4>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Cannes Lions International Festival of Creativity<br />
            22–26 June 2026 · Palais des Festivals
          </p>
          <a
            href="https://www.canneslions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            canneslions.com →
          </a>
        </div>
      </div>
      <div className="border-t border-[color:var(--hairline)] py-4 text-center text-[11px] text-[color:var(--muted)]">
        Built as an open, private alternative to the spreadsheet of doom. Not
        affiliated with Cannes Lions.
      </div>
    </footer>
  );
}
