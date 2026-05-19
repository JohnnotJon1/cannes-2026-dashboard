import { Dashboard } from "@/components/dashboard";
import { seedEvents } from "@/lib/seed";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <Dashboard seedEvents={seedEvents} />
    </div>
  );
}
