"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Events" },
  { href: "/people", label: "Who's going" },
  { href: "/profile", label: "Profile" },
  { href: "/integrations", label: "Integrations" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--hairline)] bg-sand-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3.5 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-teal-900"
          onClick={() => setOpen(false)}
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-teal-800 text-sand-50 shadow-sm">
            <span className="font-display text-lg leading-none">C</span>
            <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-coral-500 text-[7px] font-bold text-white">
              26
            </span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[17px] font-semibold tracking-tight">
              Cannes Command Center
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Lions 2026 · Jun 22–26
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-teal-800 text-sand-50"
                    : "text-[color:var(--ink-soft)] hover:bg-sand-100 hover:text-teal-900",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
          <span
            className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--hairline)] bg-white/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-teal-800"
            title="All personal data stays in your browser. Nothing is sent to a server."
          >
            <Lock className="h-3 w-3" />
            Local only
          </span>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--hairline)] text-teal-900 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-[color:var(--hairline)] bg-sand-50 px-5 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "block rounded-lg px-3 py-2 text-base font-medium",
                      active
                        ? "bg-teal-800 text-sand-50"
                        : "text-[color:var(--ink-soft)] hover:bg-sand-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center gap-2 px-1 text-[12px] text-[color:var(--muted)]">
            <Lock className="h-3.5 w-3.5 text-teal-700" />
            Personal data stays in your browser.
          </div>
        </nav>
      )}
    </header>
  );
}
