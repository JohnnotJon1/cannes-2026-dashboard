import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { addContactMessage, kvReady, rateLimitHit } from "@/lib/kv";
import { profaneWord } from "@/lib/profanity";
import type { ContactMessage } from "@/types";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

function jsonErr(status: number, error: string) {
  return Response.json({ error }, { status });
}

function trim(s: unknown, max: number): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  if (!t) return undefined;
  return t.slice(0, max);
}

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anon";
}

export async function POST(req: NextRequest) {
  if (!kvReady()) {
    return jsonErr(503, "Contact form isn't configured yet. Email john@airpost.ai.");
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonErr(400, "Invalid JSON body.");
  }

  const message = trim(body.message, MESSAGE_MAX);
  const email = trim(body.email, 200);

  if (!message || message.length < MESSAGE_MIN) {
    return jsonErr(400, `Message must be at least ${MESSAGE_MIN} characters.`);
  }
  if (email && !EMAIL_RE.test(email)) {
    return jsonErr(400, "That email address doesn't look valid.");
  }

  const flagged = profaneWord(message);
  if (flagged) {
    return jsonErr(400, `"${flagged}" isn't allowed. Rephrase and try again.`);
  }

  // Rate-limit AFTER validation, separate budget from /submit so a
  // user who already added themselves can still email John.
  const ip = clientIp(req);
  const count = await rateLimitHit(ip, "contact");
  if (count > 10) {
    return jsonErr(
      429,
      "You've sent ten messages in the past hour. Take a breath, then try again."
    );
  }

  const record: ContactMessage = {
    id: `m-${nanoid(10)}`,
    message,
    detectedAt: new Date().toISOString(),
  };
  if (email) record.email = email;

  await addContactMessage(record);

  return Response.json({ ok: true }, { status: 201 });
}
