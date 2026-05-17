import { RefreshCw } from "lucide-react";

export function LastUpdated({
  iso,
  count,
  noun,
}: {
  iso: string;
  count: number;
  noun: string;
}) {
  const d = new Date(iso);
  const label = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-white/70 px-2.5 py-1 text-[11px] font-medium text-[color:var(--muted)]"
      title="MVP: updated manually. Daily refresh cron coming next."
    >
      <RefreshCw className="h-3 w-3" />
      {count} {noun} · updated {label}
    </span>
  );
}
