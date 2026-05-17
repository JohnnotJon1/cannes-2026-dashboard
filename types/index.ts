// Cannes Command Center — shared types
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
  bio?: string;
  dietary?: string;
  updatedAt: string;
}

export const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  company: "",
  title: "",
  linkedinUrl: "",
  phone: "",
  bio: "",
  dietary: "",
  updatedAt: "",
};

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
