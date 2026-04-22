import { describeSignal } from "./signal-descriptions"

/**
 * Builds a copy-pasteable research prompt for Claude (web-enabled) to
 * research every currently-estimated signal for a single city. The
 * resulting JSON can be pasted back into /admin/research/[slug] and
 * applied to city_data_sources with source_type='researched'.
 */
export function buildResearchPrompt(args: {
  cityName: string
  country: string
  signalKeys: string[]
  today?: string
}): string {
  const today = args.today ?? new Date().toISOString().slice(0, 10)
  const signalList = args.signalKeys
    .slice()
    .sort()
    .map((k) => `  "${k}" — ${describeSignal(k).replace(/\s+/g, " ").trim()}`)
    .join("\n")

  return `You are a research agent for Uncomun, a family-relocation intelligence
platform. Your task: research each signal below for ${args.cityName}, ${args.country}
using the current public internet, and return a single JSON document.

Today's date: ${today}. Prefer sources from the last 24 months.

For EVERY signal below, return an object with:
  - value         (number 0-100, boolean, or short string — match the type hinted in the description)
  - source_url    (URL of the source you used)
  - source_name   (publisher, e.g. "WHO", "Numbeo", "Statistics NZ")
  - source_date   (ISO date of the source publication if available, else today)
  - confidence    (0-100; 90 if primary source, 70 if aggregator, 50 if inferred)
  - notes         (one short sentence explaining your reasoning)

If no reliable source exists for a signal, return null for value and
explain in notes. DO NOT fabricate sources. DO NOT guess if the public
internet doesn't support a specific number.

Source preferences (high → low):
  1. Primary government / official stats (national statistics, central bank, health ministry)
  2. Reputable aggregators (Numbeo, OECD, World Bank, WHO, Wikipedia with citations)
  3. Major news outlets (BBC, NYT, Reuters, Guardian, AP)
  4. Specialized sources (InterNations, Expat.com, OSM, CIA World Factbook, ISC Research)

Output a single JSON object with one top-level key per signal key. Keys must
match exactly. Example shape:

{
  "childSafety.streetCrime": {
    "value": 82,
    "source_url": "https://...",
    "source_name": "Numbeo Crime Index",
    "source_date": "2025-10-15",
    "confidence": 70,
    "notes": "Inverted from Numbeo Crime Index (18) → safety 82."
  },
  "...": { ... }
}

Signal keys and descriptions to research (DO NOT add keys; DO NOT skip any):
${signalList}

Return ONLY the JSON, no prose wrapper. Start with { and end with }.`
}

/**
 * Types describing the expected shape of the research response. Used by
 * the admin UI diff table and the /api/admin/research/apply endpoint.
 */
export type ResearchedSignal = {
  value: number | string | boolean | null
  source_url: string
  source_name: string
  source_date?: string
  confidence?: number
  notes?: string
}

export type ResearchResponse = Record<string, ResearchedSignal>

/**
 * Parse a pasted JSON string and validate shape. Returns the parsed
 * object or throws with a human-readable error.
 */
export function parseResearchResponse(raw: string): ResearchResponse {
  let trimmed = raw.trim()
  // Strip common fenced-code wrappers Claude sometimes emits.
  if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (err) {
    throw new Error(`JSON parse failed: ${String(err)}`)
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object with signal keys at the top level.")
  }
  const out: ResearchResponse = {}
  for (const [key, raw] of Object.entries(parsed as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`Signal ${key}: expected an object, got ${typeof raw}.`)
    }
    const s = raw as Record<string, unknown>
    if (s.value === undefined) {
      throw new Error(`Signal ${key}: missing 'value' field.`)
    }
    if (s.value !== null && typeof s.source_url !== "string") {
      throw new Error(`Signal ${key}: has a value but no string 'source_url'.`)
    }
    out[key] = {
      value: s.value as ResearchedSignal["value"],
      source_url: (s.source_url as string) ?? "",
      source_name: (s.source_name as string) ?? "Web research",
      source_date: (s.source_date as string) ?? undefined,
      confidence: typeof s.confidence === "number" ? s.confidence : undefined,
      notes: typeof s.notes === "string" ? s.notes : undefined,
    }
  }
  return out
}
