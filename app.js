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

function renderChips() {
  const chipRow = document.getElementById("chipRow");
  DEMO_SCENARIOS.forEach((scenario) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.textContent = scenario.chip;
    chip.dataset.id = scenario.id;
    chip.addEventListener("click", () => onChipClick(scenario, chip));
    chipRow.appendChild(chip);
  });
}

function onChipClick(scenario, chipEl) {
  const textarea = document.getElementById("queryInput");
  const batchOn = document.getElementById("batchMode").checked;
  const line = scenario.question.hi && Math.random() > 0.5 ? scenario.question.hi : scenario.question.en;

  if (batchOn) {
    const existing = textarea.value.split("\n").map((l) => l.trim()).filter(Boolean);
    if (existing.length >= 3) return;
    existing.push(line);
    textarea.value = existing.join("\n");
    chipEl.classList.add("selected");
  } else {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
    chipEl.classList.add("selected");
    textarea.value = line;
  }
}

function clearEmptyState(feedEl) {
  const empty = feedEl.querySelector(".empty-state");
  if (empty) empty.remove();
}

function buildResultCard(query) {
  const lang = detectLanguage(query);
  const card = document.createElement("div");
  card.className = "result-card";

  const stepsHtml = PIPELINE_STAGES.map(
    (s) => `<span class="pipeline-step" data-key="${s.key}">${s.label}</span>`
  ).join("");

  card.innerHTML = `
    <div class="result-question">
      <span>“${query}”</span>
      <span class="lang-badge">${lang}</span>
    </div>
    <div class="pipeline">${stepsHtml}</div>
    <div class="card-body"></div>
  `;

  return card;
}

function stageEl(card, key) {
  return card.querySelector(`.pipeline-step[data-key="${key}"]`);
}

function startStage(card, key) {
  const stage = PIPELINE_STAGES.find((s) => s.key === key);
  const el = stageEl(card, key);
  el.classList.add("active");
  el.innerHTML = `<span class="spinner"></span> ${stage.label}`;
}

function finishStage(card, key) {
  const stage = PIPELINE_STAGES.find((s) => s.key === key);
  const el = stageEl(card, key);
  el.classList.remove("active");
  el.classList.add("done");
  el.innerHTML = `✓ ${stage.label}`;
}

async function timedStage(card, key) {
  const stage = PIPELINE_STAGES.find((s) => s.key === key);
  startStage(card, key);
  await new Promise((r) => setTimeout(r, stage.ms));
  finishStage(card, key);
}

function revealAnswer(card, answer, isOffline) {
  const body = card.querySelector(".card-body");
  const sourcesHtml = answer.sources.map((s) => `<span class="source-chip">${s}</span>`).join("");
  const bulletsHtml = answer.bullets.map((b) => `<li>${b}</li>`).join("");
  const pct = Math.round((answer.confidence ?? 0.75) * 100);

  body.innerHTML = `
    <div class="card-category">${answer.category}${isOffline ? ' <span class="offline-tag">offline fallback</span>' : ""}</div>
    <p class="card-headline">${answer.headline}</p>
    <ul class="card-bullets">${bulletsHtml}</ul>
    <div class="card-footer">
      <div class="sources">${sourcesHtml}</div>
      <div class="confidence">
        Confidence
        <div class="confidence-bar"><div class="confidence-fill" style="width:${pct}%"></div></div>
        ${pct}%
      </div>
    </div>
  `;
  body.classList.add("revealed");
}

async function processQuery(query, feedEl, context) {
  clearEmptyState(feedEl);
  const card = buildResultCard(query);
  feedEl.prepend(card);

  // Mirror the customer's language in the answer: a Hinglish question should
  // get a Hinglish battlecard the consultant can read out as-is.
  const lang = detectLanguage(query);

  await timedStage(card, "capture");
  await timedStage(card, "understand");

  startStage(card, "retrieve");
  let answer;
  let isOffline = false;
  try {
    answer = await fetchLiveAnswer(query, context, lang);
  } catch (err) {
    console.warn("Live API failed, using offline fallback:", err.message);
    isOffline = true;
    const scenario = resolveScenario(query);
    answer = scenario ? { ...scenario.answer, category: scenario.category } : { ...DEFAULT_ANSWER };
  }
  finishStage(card, "retrieve");

  await timedStage(card, "synthesize");
  await timedStage(card, "surface");

  revealAnswer(card, answer, isOffline);
}

function onSubmit() {
  const textarea = document.getElementById("queryInput");
  const batchOn = document.getElementById("batchMode").checked;
  const raw = textarea.value.trim();
  if (!raw) return;

  const feed = document.getElementById("resultsFeed");
  const queries = batchOn
    ? raw.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3)
    : [raw.replace(/\s+/g, " ")];

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;

  Promise.all(queries.map((q) => processQuery(q, feed))).finally(() => {
    btn.disabled = false;
  });
}

// Listening mode — real mic capture via the browser's built-in speech
// recognizer (no API key), plus a deterministic scripted fallback. Both feed
// the same processQuery() pipeline used by manual mode, just auto-triggered
// instead of typed.

let recognition = null;
let isListening = false;
let isPlayingScript = false;
let liveWindow = "";
let conversationLog = [];
const MAX_CONTEXT_LINES = 6;

function logConversationLine(text) {
  conversationLog.push(text);
  if (conversationLog.length > MAX_CONTEXT_LINES) conversationLog.shift();
}

function buildContext() {
  // Everything logged before the current line — used only to resolve
  // pronouns ("iska", "that one") in the question being asked right now.
  return conversationLog.slice(0, -1).join(" | ");
}

const QUESTION_HINTS = [
  "what", "which", "how", "why", "kaunsi", "kaunsa", "konsa", "kya", "kaise", "kitna",
  "better", "compare", "price", "on-road", "resale", "mileage", "warranty",
  "emi", "down payment", "safety", "ncap", "adas", "finance", "loan",
  // Hinglish doubt markers — without these, listening mode misses questions
  // phrased fully in Hinglish ("Creta lena chahiye ya nahi?").
  "chahiye", "lena", "milega", "milta", "farak", "sasta", "mehenga", "kaisa", "kaisi",
  // Intent statements that aren't grammatical questions but are clearly doubts
  // ("I want to know about Innova", "kis tarike se Innova ka hoga").
  "want to know", "tell me", "know about", "baare mein", "batao", "kis tarah",
  "kis tarike", "hoga", "hogi", "milegi",
];

function isLikelyDoubt(text) {
  const trimmed = text.trim();
  if (trimmed.split(/\s+/).length < 4) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes("?")) return true;
  return QUESTION_HINTS.some((w) => lower.includes(w));
}
