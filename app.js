// Manual-mode demo logic. Real retrieval + synthesis happen server-side in
// server.js (Tavily search -> Gemini). The mock dataset in data.js is kept
// only as a silent fallback if that call fails (bad wifi, rate limit, no
// keys set), so a live client demo can't hard-break mid-pitch.

const PIPELINE_STAGES = [
  { key: "capture", label: "Capturing question", ms: 250 },
  { key: "understand", label: "Detecting intent", ms: 350 },
  { key: "retrieve", label: "Retrieving live sources", ms: 1200 },
  { key: "synthesize", label: "Synthesising answer", ms: 550 },
  { key: "surface", label: "Surfacing on screen", ms: 150 },
];

const DEFAULT_ANSWER = {
  category: "General",
  headline: "No live sources matched this question, and no offline fallback covers it either — try rephrasing, or ask about a specific model/spec.",
  bullets: [
    "Live retrieval and the offline fallback both came up empty for this one.",
    "Try one of the quick scenario chips, or a more specific question (model name, spec, price).",
  ],
  sources: ["no source available"],
  confidence: 0.3,
};

// Batch mode and listening mode can fire several requests within the same
// second (e.g. 3 scripted doubts in a row). Gemini's free tier has a low
// per-minute burst limit, so staggering call *starts* (not full serialization)
// meaningfully cuts down on 429s without making concurrent doubts feel serial.
let nextCallSlot = 0;
const MIN_CALL_GAP_MS = 900;

async function fetchLiveAnswer(query, context, lang) {
  const now = Date.now();
  const slot = Math.max(now, nextCallSlot);
  nextCallSlot = slot + MIN_CALL_GAP_MS;
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));

  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context: context || undefined, lang }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// Word-boundary matched (not substring) so short common tokens like "h"/"ki"/"se"
// are safe to include without false-matching inside unrelated English words.
const HINDI_WORDS = [
  "kya", "hai", "h", "nahi", "kaunsi", "konsi", "kaunsa", "konsa", "chahiye", "lena",
  "kitna", "kitne", "saal", "thoda", "kam", "keh", "raha", "rahi", "milta", "agar",
  "mein", "mei", "ki", "ka", "ke", "se", "mujhe", "tumhe", "aapko", "accha", "theek",
  "sahi", "bata", "batao", "kaise", "kyun", "kyu", "hoga", "hogi", "wala", "wali",
  "yaar", "bhai", "krna", "karna", "hona", "de sake",
];

function detectLanguage(text) {
  if (/[ऀ-ॿ]/.test(text)) return "HI";
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  const hits = words.filter((w) => HINDI_WORDS.includes(w)).length;
  return hits >= 1 ? "HINGLISH" : "EN";
}

// Car models the offline fallback dataset actually has data for. If the user's
// query names a model outside this list, the fallback must not answer as if
// it were about one of these — that's how "Thar resale value" was silently
// answering with XUV700 numbers.
const KNOWN_MODELS = ["creta", "nexon", "grand vitara", "xuv700", "seltos"];

function resolveScenario(query, minScore = 1) {
  const lower = query.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const scenario of DEMO_SCENARIOS) {
    const score = scenario.question.keywords.reduce(
      (acc, kw) => acc + (lower.includes(kw.toLowerCase()) ? 1 : 0),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      best = scenario;
    }
  }
  if (bestScore < minScore || !best) return null;

  const mentionedModels = KNOWN_MODELS.filter((m) => lower.includes(m));
  const queryMentionsAModel = /\b(creta|nexon|vitara|xuv\w*|seltos|thar|scorpio|fortuner|innova|venue|brezza|punch|harrier|safari|hyryder|swift|baleno|verna|city|ertiga)\b/i.test(lower);
  if (queryMentionsAModel && mentionedModels.length === 0) {
    // Query is about a specific model the offline dataset has no data for at all.
    return null;
  }
  if (mentionedModels.length) {
    const scenarioCoversModel = mentionedModels.some((m) =>
      best.question.keywords.some((k) => k.includes(m) || m.includes(k))
    );
    if (!scenarioCoversModel) return null;
  }

  return best;
}
