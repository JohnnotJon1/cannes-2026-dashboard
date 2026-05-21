import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { addSubmission, kvReady, rateLimitHit } from "@/lib/kv";
import { profaneWord } from "@/lib/profanity";
import type { PersonSignal } from "@/types";

export const dynamic = "force-dynamic";

const LINKEDIN_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\/[^\/?#]+\/?$/i;
const TWITTER_RE = /^https?:\/\/(www\.)?(x|twitter)\.com\/[^\/?#]+\/?$/i;
const PHOTO_URL_RE = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;
// Browsers always emit `image/jpeg` (never `image/jpg`) from canvas.toDataURL.
const PHOTO_DATA_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
// Data URL upper bound: 200 KB encoded ≈ 150 KB decoded. Client-side
// resize at 400×400 q0.85 typically yields 30-60 KB JPEG.
const PHOTO_MAX_LEN = 200_000;

function jsonErr(status: number, error: string, hint?: string) {
  return Response.json({ error, hint }, { status });
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
    return jsonErr(
      503,
      "Submissions are not configured yet.",
      "Vercel KV env vars (KV_REST_API_URL, KV_REST_API_TOKEN) are missing."
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonErr(400, "Invalid JSON body.");
  }

  // Required fields
  const name = trim(body.name, 60);
  const company = trim(body.company, 80);
  if (!name || name.length < 2) return jsonErr(400, "Please enter a real name (at least 2 characters).");
  if (!/\s/.test(name)) return jsonErr(400, "Please enter your full first + last name.");
  if (!company || company.length < 1) return jsonErr(400, "Please enter the company you work at.");

  // Optional fields
  const role = trim(body.role, 80);
  const linkedinUrl = trim(body.linkedinUrl, 200);
  const twitterUrl = trim(body.twitterUrl, 200);
  const photoUrl = trim(body.photoUrl, PHOTO_MAX_LEN);

  if (linkedinUrl && !LINKEDIN_RE.test(linkedinUrl)) {
    return jsonErr(400, "LinkedIn URL must look like https://www.linkedin.com/in/your-slug/");
  }
  if (twitterUrl && !TWITTER_RE.test(twitterUrl)) {
    return jsonErr(400, "X / Twitter URL must look like https://x.com/your-handle");
  }
  if (photoUrl && !(PHOTO_URL_RE.test(photoUrl) || PHOTO_DATA_RE.test(photoUrl))) {
    return jsonErr(
      400,
      "That photo couldn't be processed. Try uploading a JPG, PNG, or WebP."
    );
  }

  // yearSignal — default to going-this-year
  const ys = typeof body.yearSignal === "string" ? body.yearSignal : "going-this-year";
  const yearSignal: PersonSignal["yearSignal"] =
    ys === "attended-last-year" ? "attended-last-year" : "going-this-year";

  // Profanity
  const flagged = profaneWord(name, company, role);
  if (flagged) {
    return jsonErr(
      400,
      `"${flagged}" isn't allowed. If this is a real name or company, email John@airpost.ai.`
    );
  }

  // Rate limit by IP — max 3 per hour. Runs AFTER validation so a user
  // who's correcting a typo doesn't burn budget on failed attempts.
  const ip = clientIp(req);
  const count = await rateLimitHit(ip);
  if (count > 3) {
    return jsonErr(
      429,
      "You've already added three people in the past hour. Try again later — or DM John if this is wrong."
    );
  }

  const person: PersonSignal = {
    id: `u-${nanoid(10)}`,
    name,
    company,
    role: role ?? "",
    sourcePostUrl: "",
    sourceQuote: "I added myself via /submit.",
    signalReason: "Self-submitted attendee",
    yearSignal,
    detectedAt: new Date().toISOString(),
  };
  if (linkedinUrl) person.linkedinUrl = linkedinUrl;
  if (twitterUrl) person.twitterUrl = twitterUrl;
  if (photoUrl) person.photoUrl = photoUrl;

  await addSubmission(person);

  return Response.json({ ok: true, person }, { status: 201 });
}
