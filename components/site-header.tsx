"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { showEvents } from "@/lib/features";

const NAV = [
 ...(showEvents ? [{ href: "/#events", label: "Events" }] : []),
 // "Who's going" is hidden on the public deploy because the homepage
 // already IS the people list (see app/page.tsx). On the private deploy
 // it stays as a separate nav item pointing at /people.
 ...(showEvents ? [{ href: "/people", label: "Who's going" }] : []),
 // "Add yourself" is hidden on the public deploy too, the sub-hero
 // band in app/page.tsx (events-off) already surfaces it prominently,
 // and the nav variant would duplicate that CTA on first paint.
 ...(showEvents ? [{ href: "/submit", label: "Add yourself" }] : []),
 // "My profile" hidden from nav while the Chrome extension is in CWS
 // review. /profile route stays accessible by direct URL so the in-app
 // prefill (lib/registration.ts) keeps working for anyone with saved data.
];

export function SiteHeader() {
 const pathname = usePathname();
 const [open, setOpen] = useState(false);
 const [scrolled, setScrolled] = useState(false);
 const isHome = pathname === "/";
 // Overlay mode = transparent header sitting over the hero photo. Only
 // active on the home page when not scrolled past the hero and the
 // mobile menu isn't expanded.
 const overlay = isHome && !scrolled && !open;

 useEffect(() => {
 if (!isHome) {
 setScrolled(false);
 return;
 }
 const onScroll = () => {
 setScrolled(window.scrollY > window.innerHeight * 0.55);
 };
 onScroll();
 window.addEventListener("scroll", onScroll, { passive: true });
 return () => window.removeEventListener("scroll", onScroll);
 }, [isHome]);

 return (
 <header
 className={[
 "sticky top-0 z-30 transition-colors duration-200",
 overlay
 ? "bg-transparent"
 : "border-b border-[color:var(--hairline)] bg-sand-50/85 backdrop-blur",
 ].join(" ")}
 >
 <div className="mx-auto flex max-w-7xl items-center justify-end gap-6 px-5 py-3.5 lg:px-8">
 <div className="flex items-center gap-2">
 <nav className="hidden items-center gap-1 lg:flex">
 {NAV.map((item) => {
 // pathname is just the route (no hash), so /#events naturally
 // never matches, Events stays unhighlighted on the home page.
 const active = !!pathname?.startsWith(item.href);
 return (
 <Link
 key={item.href}
 href={item.href}
 className={[
 "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
 active
 ? "bg-teal-800 text-sand-50"
 : overlay
 ? "text-sand-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] hover:bg-white/15"
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
 className={[
 "inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors lg:hidden",
 overlay
 ? "border-white/30 text-sand-50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
 : "border-[color:var(--hairline)] text-teal-900",
 ].join(" ")}
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
 const active = !!pathname?.startsWith(item.href);
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
