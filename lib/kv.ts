import { kv } from "@vercel/kv";
import type { ContactMessage, PersonSignal } from "@/types";

const SUBMISSIONS_HASH = "submissions";
const SUBMISSIONS_INDEX = "submissions:index";

const MESSAGES_HASH = "contact-messages";
const MESSAGES_INDEX = "contact-messages:index";

/**
 * Whether the KV credentials are configured in the environment.
 * If not, all functions in this module no-op gracefully so the rest of
 * the site keeps working without submissions enabled.
 */
export function kvReady(): boolean {
 return Boolean(
 process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
 );
}

// ─── Submissions ──────────────────────────────────────────────────────

/**
 * KV-internal shape: the public `person` object plus a `deleteToken`
 * we return ONCE in the POST response so the submitter can later
 * remove their own card. The token NEVER appears in /api/people output.
 */
interface StoredSubmission {
 person: PersonSignal;
 deleteToken: string;
}

/**
 * Store a new self-submitted attendee. Adds the JSON-encoded person to
 * the hash + records the id in a sorted set keyed by submission time
 * so we can list newest-first without scanning the whole hash.
 */
export async function addSubmission(
 person: PersonSignal,
 deleteToken: string
): Promise<void> {
 if (!kvReady()) return;
 const wrapper: StoredSubmission = { person, deleteToken };
 await kv.hset(SUBMISSIONS_HASH, { [person.id]: JSON.stringify(wrapper) });
 await kv.zadd(SUBMISSIONS_INDEX, { score: Date.now(), member: person.id });
}

/**
 * Parse a raw KV value into a StoredSubmission. Handles both the
 * current wrapper shape and (for migration safety) bare PersonSignal
 * entries that may exist from earlier code paths.
 */
function parseStored(raw: unknown): StoredSubmission | null {
 if (raw == null) return null;
 try {
 const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
 if (parsed && typeof parsed === "object" && "person" in (parsed as object)) {
 return parsed as StoredSubmission;
 }
 // Bare PersonSignal from a prior schema, wrap with empty token.
 return { person: parsed as PersonSignal, deleteToken: "" };
 } catch {
 return null;
 }
}

/**
 * Return every submission sorted newest-first. The internal
 * `deleteToken` is stripped, only the bare PersonSignal escapes
 * this function.
 */
export async function listSubmissions(): Promise<PersonSignal[]> {
 if (!kvReady()) return [];
 const ids = (await kv.zrange<string[]>(SUBMISSIONS_INDEX, 0, -1, { rev: true })) ?? [];
 if (ids.length === 0) return [];
 const all = (await kv.hmget<Record<string, unknown>>(SUBMISSIONS_HASH, ...ids)) ?? {};
 const out: PersonSignal[] = [];
 for (const id of ids) {
 const stored = parseStored(all[id]);
 if (stored) out.push(stored.person);
 }
 return out;
}

/**
 * Read just the delete-token for a submission. Used by the public
 * DELETE handler to validate that the caller actually has the receipt.
 */
export async function getSubmissionToken(id: string): Promise<string | null> {
 if (!kvReady()) return null;
 const raw = await kv.hget<unknown>(SUBMISSIONS_HASH, id);
 const stored = parseStored(raw);
 return stored?.deleteToken || null;
}

/**
 * Hard-delete a submission by id.
 */
export async function deleteSubmission(id: string): Promise<void> {
 if (!kvReady()) return;
 await kv.hdel(SUBMISSIONS_HASH, id);
 await kv.zrem(SUBMISSIONS_INDEX, id);
}

// ─── Contact messages ─────────────────────────────────────────────────

export async function addContactMessage(msg: ContactMessage): Promise<void> {
 if (!kvReady()) return;
 await kv.hset(MESSAGES_HASH, { [msg.id]: JSON.stringify(msg) });
 await kv.zadd(MESSAGES_INDEX, { score: Date.now(), member: msg.id });
}

export async function listContactMessages(): Promise<ContactMessage[]> {
 if (!kvReady()) return [];
 const ids = (await kv.zrange<string[]>(MESSAGES_INDEX, 0, -1, { rev: true })) ?? [];
 if (ids.length === 0) return [];
 const all = (await kv.hmget<Record<string, unknown>>(MESSAGES_HASH, ...ids)) ?? {};
 const out: ContactMessage[] = [];
 for (const id of ids) {
 const raw = all[id];
 if (raw == null) continue;
 try {
 const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
 out.push(parsed as ContactMessage);
 } catch {
 // skip malformed
 }
 }
 return out;
}

export async function deleteContactMessage(id: string): Promise<void> {
 if (!kvReady()) return;
 await kv.hdel(MESSAGES_HASH, id);
 await kv.zrem(MESSAGES_INDEX, id);
}

// ─── Shared ───────────────────────────────────────────────────────────

/**
 * Rate-limit helper: increment a counter scoped to `bucket` (e.g. the
 * client IP) within the current hour. Returns the new count after the
 * increment. The key auto-expires after 1h so it self-cleans.
 *
 * Callers should pick a distinct `prefix` per endpoint so /submit
 * doesn't share a budget with /contact.
 */
export async function rateLimitHit(
 bucket: string,
 prefix: string = "submit"
): Promise<number> {
 if (!kvReady()) return 1; // permissive when KV not configured
 const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
 const key = `${prefix}:rate:${bucket}:${hour}`;
 const count = await kv.incr(key);
 if (count === 1) await kv.expire(key, 3600);
 return count;
}
