import type { AnyEvent, UserProfile } from "@/types";

// Smart-assist registration. Build the best possible prefilled URL for
// an event's RSVP form using the user's saved profile, and expose a small
// set of profile fields that the user can click-to-copy when a form
// doesn't fully prefill.
//
// Privacy: this whole module is client-side. The profile never leaves the
// user's browser. The "prefill" is just URL query params that the third-
// party form's frontend reads and pre-populates.

type ProfileVar =
  | "name"
  | "firstName"
  | "lastName"
  | "email"
  | "company"
  | "title"
  | "linkedinUrl"
  | "phone";

function splitName(name: string): { first: string; last: string } {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
}

function resolveVar(v: ProfileVar, profile: UserProfile): string {
  const { first, last } = splitName(profile.name);
  switch (v) {
    case "name":
      return profile.name ?? "";
    case "firstName":
      return first;
    case "lastName":
      return last;
    case "email":
      return profile.email ?? "";
    case "company":
      return profile.company ?? "";
    case "title":
      return profile.title ?? "";
    case "linkedinUrl":
      return profile.linkedinUrl ?? "";
    case "phone":
      return profile.phone ?? "";
  }
}

const VAR_PATTERN = /{{\s*([a-zA-Z]+)\s*}}/g;

/**
 * Substitute {{var}} placeholders against the user's profile and URL-encode
 * each value. Returns the resolved URL, or the raw registrationUrl when no
 * prefill template exists.
 *
 * Returns null if the event has neither a prefillUrl nor a registrationUrl.
 */
export function buildRegistrationUrl(
  event: AnyEvent,
  profile: UserProfile
): string | null {
  const template = event.prefillUrl ?? event.registrationUrl ?? null;
  if (!template) return null;

  // Explicit prefillUrl template: substitute {{var}} placeholders.
  if (event.prefillUrl) {
    return template.replace(VAR_PATTERN, (_match, key: string) => {
      const value = resolveVar(key as ProfileVar, profile);
      return encodeURIComponent(value);
    });
  }

  // No template: append the standard profile params to registrationUrl so
  // forms that read query params (HubSpot, Splash That, Cvent, etc.) prefill
  // without needing the Chrome extension. Skip empty fields. URLs that
  // ignore query params (Luma, Eventbrite SPAs) silently drop these.
  const { first, last } = splitName(profile.name);
  const params: Array<[string, string]> = [];
  if (first) params.push(["firstname", first]);
  if (last) params.push(["lastname", last]);
  if (profile.email) params.push(["email", profile.email]);
  if (profile.company) params.push(["company", profile.company]);
  if (profile.title) params.push(["jobtitle", profile.title]);
  if (params.length === 0) return template;

  try {
    const url = new URL(template);
    for (const [k, v] of params) url.searchParams.set(k, v);
    return url.toString();
  } catch {
    return template;
  }
}

/**
 * Returns the list of profile fields that are useful to surface as
 * click-to-copy chips when a form didn't fully prefill. Skips empty fields
 * so we don't waste screen space on "Copy: (empty)".
 */
export function copyableFields(
  profile: UserProfile
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  if (profile.name) rows.push({ label: "Name", value: profile.name });
  if (profile.email) rows.push({ label: "Email", value: profile.email });
  if (profile.company) rows.push({ label: "Company", value: profile.company });
  if (profile.title) rows.push({ label: "Title", value: profile.title });
  if (profile.linkedinUrl)
    rows.push({ label: "LinkedIn", value: profile.linkedinUrl });
  if (profile.phone) rows.push({ label: "Phone", value: profile.phone });
  return rows;
}
