import { notFound } from "next/navigation";
import { AdminList } from "@/components/admin-list";
import { AdminMessages } from "@/components/admin-messages";
import { listSubmissions, listContactMessages, kvReady } from "@/lib/kv";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Admin · Cannes 2026 submissions",
 robots: { index: false, follow: false },
};

// Always SSR. Token is passed in via ?token=..., no caching.
export const dynamic = "force-dynamic";

export default async function AdminPage({
 searchParams,
}: {
 searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
 const params = await searchParams;
 const tokenParam = params.token;
 const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
 const expected = process.env.ADMIN_TOKEN;

 if (!expected || !token || token !== expected) {
 notFound();
 }

 if (!kvReady()) {
 return (
 <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">
 <h1 className="font-display text-3xl font-semibold text-teal-900">
 Admin
 </h1>
 <p className="mt-3 text-[14px] text-coral-700">
 Vercel KV environment variables are missing. Set up the KV database in
 the Vercel dashboard and redeploy.
 </p>
 </div>
 );
 }

 // Fetch both KV reads in parallel, neither blocks the other.
 const [submissions, messages] = await Promise.all([
 listSubmissions(),
 listContactMessages(),
 ]);

 return (
 <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8 lg:py-12">
 <div className="space-y-12">
 <section className="space-y-4">
 <div className="space-y-2">
 <h1 className="font-display text-3xl font-semibold text-teal-900">
 Self-submitted attendees
 </h1>
 <p className="text-[13px] text-[color:var(--muted)]">
 {submissions.length} {submissions.length === 1 ? "entry" : "entries"}.
 Newest first. Click <strong>Remove</strong> to hard-delete from
 the list. Action is immediate; no undo.
 </p>
 </div>
 <AdminList initial={submissions} token={token!} />
 </section>

 <section className="space-y-4">
 <div className="space-y-2">
 <h2 className="font-display text-2xl font-semibold text-teal-900">
 Support messages
 </h2>
 <p className="text-[13px] text-[color:var(--muted)]">
 {messages.length} {messages.length === 1 ? "message" : "messages"} via /contact.
 Click the email to reply. Click <strong>Remove</strong> to delete.
 </p>
 </div>
 <AdminMessages initial={messages} token={token!} />
 </section>
 </div>
 </div>
 );
}
