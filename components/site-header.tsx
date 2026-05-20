"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Events" },
  { href: "/people", label: "Who's going" },
  { href: "/profile", label: "Profile" },
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
          <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-800 text-sand-50 shadow-sm">
            <span className="font-display text-xl leading-none">C</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
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
        </nav>
      )}
    </header>
  );
}
