import { NextRequest } from "next/server";
import {
  deleteSubmission,
  getSubmissionToken,
  kvReady,
  rateLimitHit,
} from "@/lib/kv";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anon";
}

/**
 * Public DELETE handler — lets the original submitter remove their own
 * card without an admin token. Authentication is the `?token=` query
 * param, which must match the `deleteToken` stored alongside the
 * submission in KV (generated server-side at submit time and returned
 * once in the POST response).
 *
 * Returns 404 on any miss (wrong id, wrong token) so the existence of
 * an id is not leaked to a guesser.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!kvReady()) {
    return Response.json({ error: "KV not configured." }, { status: 503 });
  }

  // Rate-limit self-deletes (3 per IP per hour) so a guesser can't
  // hammer the endpoint trying random tokens. Uses a separate budget
  // from /submit so a legit user who just added themselves doesn't
  // burn their delete budget too.
  const ip = clientIp(req);
  const count = await rateLimitHit(ip, "delete");
  if (count > 3) {
    return Response.json(
      { error: "Too many delete attempts. Wait an hour or email John." },
      { status: 429 }
    );
  }

  const { id } = await context.params;
  if (!id) return new Response("Not found", { status: 404 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return new Response("Not found", { status: 404 });

  const stored = await getSubmissionToken(id);
  if (!stored || stored !== token) {
    return new Response("Not found", { status: 404 });
  }

  await deleteSubmission(id);
  return Response.json({ ok: true, id });
}
