import profanity from "leo-profanity";

// Initialize once on module load with the English dictionary plus a few
// targeted additions (slurs / common spam terms not in the default set).
profanity.loadDictionary("en");
profanity.add([
  "fuckface",
  "shithead",
  "dickhead",
  "twatwaffle",
]);

// Words allowed even though they collide with the dictionary (e.g.,
// surnames or company names that get false-positive matches).
profanity.remove([
  "cock", // common surname
  "dick", // common given name (Richard)
]);

/**
 * Check that none of the supplied strings contain a flagged word.
 * Returns the first offending word found, or null if all are clean.
 */
export function profaneWord(...strings: (string | null | undefined)[]): string | null {
  for (const s of strings) {
    if (!s) continue;
    const hit = profanity.check(s);
    if (hit) {
      // leo-profanity .check() returns boolean; use .badWordsUsed() if available
      // (newer versions). Fallback: re-tokenize to find the word for the error msg.
      const words = s.toLowerCase().split(/[\s,.;:!?'"()\-_/]+/).filter(Boolean);
      for (const w of words) {
        if (profanity.check(w)) return w;
      }
      return "(flagged content)";
    }
  }
  return null;
}
