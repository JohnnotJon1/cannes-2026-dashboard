// Build-time feature flags. Each Vercel project (or local dev) sets
// its own env vars and the values are inlined into the bundle.
//
// NEXT_PUBLIC_SHOW_EVENTS controls whether the events grid + nav items
// appear on this deployment. Defaults to true so omitting the var
// leaves everything ON (the private/internal deploy keeps working
// unchanged). The public LinkedIn-facing deploy sets it to "false"
// to ship only the networking side of the site.

export const showEvents =
  process.env.NEXT_PUBLIC_SHOW_EVENTS !== "false";

// Public URL of the current deployment, used for OG meta resolution.
// Falls back to the canonical private URL so existing behavior is
// preserved when the var is unset.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://cannes-2026-dashboard.vercel.app";
