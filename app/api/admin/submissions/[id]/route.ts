import { NextRequest } from "next/server";
import { deleteSubmission, kvReady } from "@/lib/kv";

export const dynamic = "force-dynamic";

function checkAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const token = req.nextUrl.searchParams.get("token") ?? req.headers.get("x-admin-token");
  return token === expected;
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!checkAdmin(req)) {
    // Return 404 (not 401) so the existence of /admin is not leaked.
    return new Response("Not found", { status: 404 });
  }
  if (!kvReady()) {
    return Response.json({ error: "KV not configured." }, { status: 503 });
  }
  const { id } = await context.params;
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });

  await deleteSubmission(id);
  return Response.json({ ok: true, id });
}
