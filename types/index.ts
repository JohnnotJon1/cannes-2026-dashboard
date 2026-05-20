// Cannes Lions 2026 dashboard. Shared types.
//
// Two clean data tiers:
//  1. Public, ships in repo (CannesEvent, PersonSignal, RefreshMetadata)
//  2. Private, lives in localStorage only (UserProfile, EventStatusRecord,
//     CustomEvent, EventNote)

export type EventCategory =
  | "beach-club"
  | "party"
  | "panel"
  | "dinner"
  | "brunch"
  | "yacht"
  | "activation"
  | "awards"
  | "workshop"
  | "networking";

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "beach-club", label: "Beach club" },
  { value: "party", label: "Party" },
  { value: "panel", label: "Panel" },
  { value: "dinner", label: "Dinner" },
  { value: "brunch", label: "Brunch" },
  { value: "yacht", label: "Yacht" },
  { value: "activation", label: "Activation" },
  { value: "awards", label: "Awards" },
  { value: "workshop", label: "Workshop" },
  { value: "networking", label: "Networking" },
];

export type EventStatus =
  | "registered"
  | "not-registered"
  | "pending"
  | "action-needed"
  | "attended"
  | "skipped";

export const EVENT_STATUSES: { value: EventStatus; label: string }[] = [
  { value: "registered", label: "Registered" },
  { value: "pending", label: "Pending" },
  { value: "action-needed", label: "Action needed" },
  { value: "not-registered", label: "Not registered" },
  { value: "attended", label: "Attended" },
  { value: "skipped", label: "Skipped" },
];

export type RegistrationType =
  | "open"
  | "invite-only"
  | "application"
  | "press"
  | "unknown";

export type ConfidenceLevel = "verified" | "likely" | "unconfirmed";

export interface CannesEvent {
  id: string;
  name: string;
  organizer: string;
  category: EventCategory;
  startDate: string; // ISO
  endDate?: string;
  location: string;
  description: string;
  registrationUrl?: string;
  registrationType: RegistrationType;
  nextAction?: string;
  source: string;
  confidence: ConfidenceLevel;
  tags?: string[];
  defaultStatus?: EventStatus; // suggestion until user marks one
  /**
   * Optional URL template for prefilling the registration form via query
   * params. Supports {{name}}, {{firstName}}, {{lastName}}, {{email}},
   * {{company}}, {{title}}, {{linkedinUrl}}, {{phone}}. If absent, the
   * raw registrationUrl is opened (browser autofill still handles common
   * name/email fields for most forms).
   */
  prefillUrl?: string;
  /**
   * Optional hero image shown on the event card. Either a local path like
   * `/events/<id>.jpg` (scraped from the event's og:image and committed to
   * the repo) or an absolute URL. If absent, the card falls back to a
   * category-tinted gradient.
   */
  imageUrl?: string;
}

export interface CustomEvent extends CannesEvent {
  isCustom: true;
  createdAt: string;
}

export type AnyEvent = CannesEvent | CustomEvent;

export interface UserProfile {
  name: string;
  email: string;
  company: string;
  title: string;
  linkedinUrl?: string;
  phone?: string;
  updatedAt: string;
}

export const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  company: "",
  title: "",
  linkedinUrl: "",
  phone: "",
  updatedAt: "",
};

// When the app eventually auto-fills event registration forms (future
// integration work), use these defaults instead of asking the user for
// bio or dietary preferences. Per John: always N/A on bios, always
// "No food preferences" on dietary fields.
export const REGISTRATION_DEFAULTS = {
  bio: "N/A",
  dietary: "No food preferences",
} as const;

export interface EventStatusRecord {
  eventId: string;
  status: EventStatus;
  notes?: string;
  updatedAt: string;
}

export type StatusMap = Record<string, EventStatusRecord>;

export interface PersonSignal {
  id: string;
  name: string;
  company: string;
  role: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  /**
   * Optional direct URL to a profile headshot. Used when neither
   * the Twitter avatar (via unavatar.io) nor initials are ideal.
   * Pulled from LinkedIn (signed media.licdn.com URLs — expire in
   * ~30 days, re-scrape periodically) or other public sources.
   */
  photoUrl?: string;
  sourcePostUrl: string;
  sourceQuote: string;
  signalReason: string;
  yearSignal: "going-this-year" | "attended-last-year";
  detectedAt: string;
  isSample?: boolean;
}

export type IntegrationState = "not-connected" | "coming-soon";

export interface IntegrationStatus {
  gmail: IntegrationState;
  gcal: IntegrationState;
  linkedin: IntegrationState;
}

export interface RefreshMetadata {
  events: { lastUpdated: string; count: number };
  people: { lastUpdated: string; count: number };
}
