"use client";

import { useState } from "react";
import { Trash2, Mail } from "lucide-react";
import type { ContactMessage } from "@/types";

export function AdminMessages({
 initial,
 token,
}: {
 initial: ContactMessage[];
 token: string;
}) {
 const [rows, setRows] = useState<ContactMessage[]>(initial);
 const [busy, setBusy] = useState<string | null>(null);

 async function remove(id: string) {
 setBusy(id);
 try {
 const res = await fetch(
 `/api/admin/contact/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
 { method: "DELETE" }
 );
 if (res.ok) {
 setRows((prev) => prev.filter((r) => r.id !== id));
 } else {
 alert("Delete failed, check the admin token.");
 }
 } catch {
 alert("Network error.");
 } finally {
 setBusy(null);
 }
 }

 if (rows.length === 0) {
 return (
 <div className="rounded-2xl border border-[color:var(--hairline)] bg-white/70 p-6 text-[14px] text-[color:var(--muted)]">
 No support messages yet. They&apos;ll show up here whenever anyone
 uses /contact.
 </div>
 );
 }

 return (
 <div className="space-y-3">
 {rows.map((r) => (
 <article
 key={r.id}
 className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4"
 >
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="space-y-1">
 <div className="text-[12px] text-[color:var(--muted)]">
 {new Date(r.detectedAt).toLocaleString()}
 </div>
 {r.email ? (
 <a
 href={`mailto:${r.email}?subject=Re:%20Cannes%202026%20dashboard`}
 className="inline-flex items-center gap-1.5 text-[13px] font-medium text-teal-700 hover:underline"
 >
 <Mail className="h-3.5 w-3.5" />
 {r.email}
 </a>
 ) : (
 <div className="text-[12px] italic text-[color:var(--muted)]">
 No reply email given
 </div>
 )}
 </div>
 <button
 type="button"
 onClick={() => remove(r.id)}
 disabled={busy === r.id}
 className="inline-flex items-center gap-1 rounded-full border border-coral-200 bg-coral-50 px-2.5 py-1 text-[12px] font-medium text-coral-700 hover:bg-coral-100 disabled:opacity-50"
 >
 <Trash2 className="h-3 w-3" />
 {busy === r.id ? "…" : "Remove"}
 </button>
 </div>
 <p className="mt-3 whitespace-pre-wrap rounded-xl bg-sand-50 px-3 py-2.5 text-[14px] leading-relaxed text-teal-900 ring-1 ring-[color:var(--hairline)]">
 {r.message}
 </p>
 </article>
 ))}
 </div>
 );
}
