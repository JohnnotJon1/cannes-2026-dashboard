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
        <h1 className="font-display text-4xl font-semibold leading-tight text-teal-900 sm:text-5xl">
          Fill once. Paste into every RSVP form.
        </h1>

        <ProfileForm />
      </div>
    </div>
  );
}
