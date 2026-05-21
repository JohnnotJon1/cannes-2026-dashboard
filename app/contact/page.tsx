import { ContactForm } from "@/components/contact-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support · Cannes Lions 2026",
  description:
    "Get in touch about the Cannes 2026 dashboard — typos, removal requests, partnerships, anything.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
            Get in touch.
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
            Want to be removed from the attendees list? Spot a typo? Have a
            question? Drop a note here. Goes straight to John&apos;s admin
            inbox.
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
