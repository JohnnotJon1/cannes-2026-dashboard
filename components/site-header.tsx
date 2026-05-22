"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { showEvents } from "@/lib/features";

// Per-mode nav. Private deploy keeps the original three-item nav; public
// deploy gets a focused two-tab toggle between the people list (home) and
// the open-registration events page.
const NAV = showEvents
 ? [
 { href: "/#events", label: "Events" },
 { href: "/people", label: "Who's going" },
 { href: "/submit", label: "Add yourself" },
 ]
 : [
 { href: "/#people", label: "Who's going" },
 { href: "/events", label: "Events" },
 ];

// Active-state check that handles hash-anchor hrefs. `usePathname()` strips
// the hash so a naive startsWith match against "/#events" never fires;
// strip the hash from the target before comparing, and use exact match for
// the root path so "/" doesn't light up on every page.
function isActive(itemHref: string, pathname: string | null): boolean {
 if (!pathname) return false;
 const target = itemHref.split("#")[0] || "/";
 if (target === "/") return pathname === "/";
 return pathname.startsWith(target);
}

export function SiteHeader() {
 const pathname = usePathname();
 const [open, setOpen] = useState(false);

 // Always render the header as a frosted sand bar — the previous
 // "transparent over hero" overlay mode was making the nav pills
 // unreadable against the lighter parts of the Croisette photo.
 // The hero still bleeds up under the header via -mt-[68px] in
 // app/page.tsx, so the photo edge-to-top effect is preserved, just
 // dimly visible through the backdrop-blur.

 return (
 <header
 className="sticky top-0 z-30 border-b border-[color:var(--hairline)] bg-sand-50/85 backdrop-blur"
 >
 <div className="mx-auto flex max-w-7xl items-center justify-end gap-6 px-5 py-3.5 lg:px-8">
 <div className="flex items-center gap-2">
 <nav className="hidden items-center gap-1 lg:flex">
 {NAV.map((item) => {
 // pathname is just the route (no hash), so /#events naturally
 // never matches, Events stays unhighlighted on the home page.
 const active = isActive(item.href, pathname);
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

 {NAV.length > 0 && (
 <button
 type="button"
 onClick={() => setOpen((v) => !v)}
 className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--hairline)] text-teal-900 transition-colors lg:hidden"
 aria-label={open ? "Close menu" : "Open menu"}
 >
 {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
 </button>
 )}
 </div>
 </div>

 {open && NAV.length > 0 && (
 <nav className="border-t border-[color:var(--hairline)] bg-sand-50 px-5 py-3 lg:hidden">
 <ul className="flex flex-col gap-1">
 {NAV.map((item) => {
 const active = isActive(item.href, pathname);
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
