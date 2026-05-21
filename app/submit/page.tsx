import { Suspense } from "react";
import { SubmitForm } from "@/components/submit-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add yourself to the Cannes 2026 list",
  description:
    "Going to Cannes Lions 2026? Add yourself so others know — your card will appear on the attendees page within seconds.",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-7">
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Going to Cannes 2026? Add yourself.
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            Drop your name, company, and LinkedIn. You&apos;ll appear on the
            attendees page within seconds.
          </p>
        </div>

        {/* SubmitForm reads ?prefillName=... via useSearchParams, which
            requires a Suspense boundary at the static-generation seam. */}
        <Suspense fallback={null}>
          <SubmitForm />
        </Suspense>
      </div>
    </div>
  );
}
