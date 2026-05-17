import { User, Lock, ShieldCheck, ClipboardCopy } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your profile",
  description:
    "The information you most often paste into Cannes event registration forms. Stored locally in your browser only — never sent to a server.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-7">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
            <User className="h-3.5 w-3.5" />
            Your profile
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Fill once. Paste into every RSVP form.
          </h1>
          <p className="text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            Most Cannes event forms ask for the same six fields. Save them here once
            and pull them up when registering. Everything you type stays in this browser&apos;s
            <code className="mx-1 rounded bg-sand-100 px-1.5 py-0.5 text-[12.5px] text-teal-900">localStorage</code>
            — there&apos;s no backend writing it anywhere.
          </p>
        </section>

        <div className="grid gap-3 rounded-2xl border border-[color:var(--hairline)] bg-sand-100 px-4 py-4 text-[13px] sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 text-teal-700" />
            <div>
              <div className="font-semibold text-teal-900">Local only</div>
              <div className="text-[color:var(--muted)]">
                Never POSTed to a server.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-teal-700" />
            <div>
              <div className="font-semibold text-teal-900">Owner-blind</div>
              <div className="text-[color:var(--muted)]">
                The site owner can&apos;t see it.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ClipboardCopy className="mt-0.5 h-4 w-4 text-teal-700" />
            <div>
              <div className="font-semibold text-teal-900">Copy-friendly</div>
              <div className="text-[color:var(--muted)]">
                Quick paste into event forms.
              </div>
            </div>
          </div>
        </div>

        <ProfileForm />
      </div>
    </div>
  );
}
