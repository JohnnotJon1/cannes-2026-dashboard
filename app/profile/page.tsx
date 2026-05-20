import { User } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your profile",
  description:
    "The information you most often paste into Cannes event registration forms. Stored locally in your browser only. Never sent to a server.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-7">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
              <User className="h-3.5 w-3.5" />
              Your profile
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-sand-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700">
              Required for auto-fill
            </span>
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Fill once. Paste into every RSVP form.
          </h1>
        </section>

        <ProfileForm />
      </div>
    </div>
  );
}
