import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-[color:var(--hairline-strong)] bg-white/60 px-6 py-16 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-teal-800">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-teal-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-[color:var(--muted)]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
