"use client";

import { CheckCircle2, Clock3, AlertTriangle, Compass } from "lucide-react";
import type { AnyEvent, StatusMap } from "@/types";
import { resolveStatus } from "@/lib/filters";

export function DashboardStats({
  events,
  statusMap,
}: {
  events: AnyEvent[];
  statusMap: StatusMap;
}) {
  let registered = 0;
  let pending = 0;
  let action = 0;
  for (const e of events) {
    const s = resolveStatus(e, statusMap);
    if (s === "registered" || s === "attended") registered++;
    else if (s === "pending") pending++;
    else if (s === "action-needed") action++;
  }
  const total = events.length;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <Stat
        Icon={Compass}
        label="Total events"
        value={total}
        tone="ink"
      />
      <Stat
        Icon={CheckCircle2}
        label="Registered"
        value={registered}
        tone="teal"
      />
      <Stat
        Icon={Clock3}
        label="Pending"
        value={pending}
        tone="amber"
      />
      <Stat
        Icon={AlertTriangle}
        label="Action needed"
        value={action}
        tone="coral"
      />
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: typeof Compass;
  label: string;
  value: number;
  tone: "ink" | "teal" | "amber" | "coral";
}) {
  const toneClasses = {
    ink: "border-[color:var(--hairline)] bg-white text-[color:var(--ink)]",
    teal: "border-teal-700/30 bg-teal-100 text-teal-900",
    amber: "border-amber-500/30 bg-amber-100 text-amber-600",
    coral: "border-coral-500/30 bg-coral-100 text-coral-600",
  }[tone];
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 ${toneClasses}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70">
        <Icon className="h-4 w-4" />
      </span>
      <div className="leading-tight">
        <div className="font-display text-2xl font-semibold">{value}</div>
        <div className="text-[11px] uppercase tracking-widest opacity-80">
          {label}
        </div>
      </div>
    </div>
  );
}
