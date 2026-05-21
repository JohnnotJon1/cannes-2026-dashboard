import { listSubmissions } from "@/lib/kv";

export const dynamic = "force-dynamic";
export const revalidate = 10;

/**
 * GET /api/people
 * Returns only the self-submitted entries from KV. The curated 1,658
 * are statically baked into the page bundle via lib/seed.ts, so the
 * client already has them — we just need to layer KV submissions on top.
 */
export async function GET() {
  const submitted = await listSubmissions();
  return Response.json(
    { submitted },
    {
      headers: {
        // Allow the CDN to cache for 10s so a viral burst doesn't hammer KV.
        "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}
