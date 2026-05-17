import {
  CheckCircle2,
  Clock3,
  AlertTriangle,
  XCircle,
  Sparkles,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import type { EventStatus } from "@/types";

type Variant = {
  label: string;
  Icon: LucideIcon;
  pill: string; // tailwind classes for badge background + border + text
  dot: string;
};

const VARIANTS: Record<EventStatus, Variant> = {
  registered: {
    label: "Registered",
    Icon: CheckCircle2,
    pill: "bg-teal-800 text-sand-50 border-teal-800",
    dot: "bg-sand-50",
  },
  pending: {
    label: "Pending",
    Icon: Clock3,
    pill: "bg-amber-100 text-amber-600 border-amber-500/40",
    dot: "bg-amber-600",
  },
  "action-needed": {
    label: "Action needed",
    Icon: AlertTriangle,
    pill: "bg-coral-100 text-coral-600 border-coral-500/40",
    dot: "bg-coral-600",
  },
  "not-registered": {
    label: "Not registered",
    Icon: XCircle,
    pill: "bg-sand-100 text-[color:var(--ink-soft)] border-[color:var(--hairline)]",
    dot: "bg-[color:var(--ink-soft)]",
  },
  attended: {
    label: "Attended",
    Icon: Sparkles,
    pill: "bg-teal-100 text-teal-800 border-teal-700/30",
    dot: "bg-teal-700",
  },
  skipped: {
    label: "Skipped",
    Icon: CircleSlash,
    pill: "bg-sand-200 text-[color:var(--muted)] border-[color:var(--hairline)]",
    dot: "bg-[color:var(--muted)]",
  },
};

export function StatusBadge({
  status,
  size = "md",
}: {
  status: EventStatus;
  size?: "sm" | "md";
}) {
  const v = VARIANTS[status];
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        padding,
        v.pill,
      ].join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", v.dot].join(" ")} />
      <v.Icon className="h-3 w-3" />
      <span>{v.label}</span>
    </span>
  );
}
