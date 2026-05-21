import { kv } from "@vercel/kv";
import type { PersonSignal } from "@/types";

const SUBMISSIONS_HASH = "submissions";
const SUBMISSIONS_INDEX = "submissions:index";

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

/**
 * Store a new self-submitted attendee. Adds the JSON-encoded person to
 * the hash + records the id in a sorted set keyed by submission time
 * so we can list newest-first without scanning the whole hash.
 */
export async function addSubmission(person: PersonSignal): Promise<void> {
  if (!kvReady()) return;
  const value = JSON.stringify(person);
  await kv.hset(SUBMISSIONS_HASH, { [person.id]: value });
  await kv.zadd(SUBMISSIONS_INDEX, { score: Date.now(), member: person.id });
}

/**
 * Return every submission sorted newest-first.
 */
export async function listSubmissions(): Promise<PersonSignal[]> {
  if (!kvReady()) return [];
  // ZRANGE with REV = descending order = newest first
  const ids = (await kv.zrange<string[]>(SUBMISSIONS_INDEX, 0, -1, { rev: true })) ?? [];
  if (ids.length === 0) return [];
  const all = (await kv.hmget<Record<string, string>>(SUBMISSIONS_HASH, ...ids)) ?? {};
  const out: PersonSignal[] = [];
  for (const id of ids) {
    const raw = all[id];
    if (!raw) continue;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as PersonSignal);
      out.push(parsed as PersonSignal);
    } catch {
      // skip malformed
    }
  }
  return out;
}

/**
 * Hard-delete a submission by id.
 */
export async function deleteSubmission(id: string): Promise<void> {
  if (!kvReady()) return;
  await kv.hdel(SUBMISSIONS_HASH, id);
  await kv.zrem(SUBMISSIONS_INDEX, id);
}

/**
 * Rate-limit helper: increment a counter scoped to `bucket` (e.g. the
 * client IP) within the current hour. Returns the new count after the
 * increment. The key auto-expires after 1h so it self-cleans.
 */
export async function rateLimitHit(bucket: string): Promise<number> {
  if (!kvReady()) return 1; // permissive when KV not configured
  const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const key = `submit:rate:${bucket}:${hour}`;
  const count = await kv.incr(key);
  if (count === 1) await kv.expire(key, 3600);
  return count;
}
