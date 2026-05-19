import eventsJson from "@/data/events.json";
import peopleJson from "@/data/people.json";
import refreshJson from "@/data/refresh.json";
import type { CannesEvent, PersonSignal, RefreshMetadata } from "@/types";

// These imports happen at build time. JSON is validated at type-check via
// the explicit `as` cast. Keep the JSON shape aligned with the interfaces.

export const seedEvents = eventsJson as CannesEvent[];
export const seedPeople = peopleJson as PersonSignal[];
export const refreshMetadata = refreshJson as RefreshMetadata;
