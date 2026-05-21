"use client";

import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import type { PersonSignal } from "@/types";

export function AdminList({
 initial,
 token,
}: {
 initial: PersonSignal[];
 token: string;
}) {
 const [rows, setRows] = useState<PersonSignal[]>(initial);
 const [busy, setBusy] = useState<string | null>(null);

 async function remove(id: string) {
 setBusy(id);
 try {
 const res = await fetch(
 `/api/admin/submissions/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`,
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
 No self-submitted entries yet. They&apos;ll appear here the moment
 anyone uses /submit.
 </div>
 );
 }

 return (
 <div className="overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-white">
 <table className="w-full text-[13px]">
 <thead className="bg-sand-100 text-left text-[12px] uppercase tracking-wide text-[color:var(--muted)]">
 <tr>
 <th className="px-3 py-2">When</th>
 <th className="px-3 py-2">Name</th>
 <th className="px-3 py-2">Company / role</th>
 <th className="px-3 py-2">Links</th>
 <th className="px-3 py-2"></th>
 </tr>
 </thead>
 <tbody>
 {rows.map((r) => (
 <tr key={r.id} className="border-t border-[color:var(--hairline)]">
 <td className="px-3 py-2 text-[12px] text-[color:var(--muted)] whitespace-nowrap">
 {new Date(r.detectedAt).toLocaleString()}
 </td>
 <td className="px-3 py-2 font-medium text-teal-900">
 {r.photoUrl ? (
 <span className="inline-flex items-center gap-2">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={r.photoUrl}
 alt=""
 className="h-6 w-6 rounded-full object-cover"
 />
 {r.name}
 </span>
 ) : (
 r.name
 )}
 </td>
 <td className="px-3 py-2">
 <div className="text-[color:var(--ink-soft)]">{r.company}</div>
 {r.role && (
 <div className="text-[12px] text-[color:var(--muted)]">
 {r.role}
 </div>
 )}
 </td>
 <td className="px-3 py-2 space-x-2 text-[12px]">
 {r.linkedinUrl && (
 <a
 href={r.linkedinUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-teal-700 hover:underline"
 >
 LI <ExternalLink className="h-3 w-3" />
 </a>
 )}
 {r.twitterUrl && (
 <a
 href={r.twitterUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-teal-700 hover:underline"
 >
 X <ExternalLink className="h-3 w-3" />
 </a>
 )}
 </td>
 <td className="px-3 py-2 text-right">
 <button
 type="button"
 onClick={() => remove(r.id)}
 disabled={busy === r.id}
 className="inline-flex items-center gap-1 rounded-full border border-coral-200 bg-coral-50 px-2.5 py-1 text-[12px] font-medium text-coral-700 hover:bg-coral-100 disabled:opacity-50"
 >
 <Trash2 className="h-3 w-3" />
 {busy === r.id ? "…" : "Remove"}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 );
}
