// Backend for the CarCred AI Sales Assistant demo. Holds the Gemini/Tavily
// API keys server-side (never sent to the browser) and exposes one endpoint
// that mirrors the proposal's pipeline: retrieve from an allow-list of
// trustworthy domains via Tavily, then synthesise a sourced, persuasive
// battlecard via Gemini. Falls back to the local mock dataset if either
// call fails, so a flaky connection can't break a live client demo.

const path = require("path");
const express = require("express");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const PORT = process.env.PORT || 8734;

const ALLOWED_DOMAINS = [
  "cardekho.com",
  "carwale.com",
  "zigwheels.com",
  "cars24.com",
  "hyundai.com",
  "tatamotors.com",
  "marutisuzuki.com",
  "mahindra.com",
  "kia.com",
  "globalncap.org",
];

const app = express();
app.use(express.json());
// Serve demo assets with caching disabled — a live demo must always pick up
// the latest app.js/data.js on refresh, never a stale cached copy.
app.use(express.static(__dirname, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => res.setHeader("Cache-Control", "no-store"),
}));

async function tavilyRequest(body) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Tavily error ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

async function tavilySearch(searchQuery) {
  const base = { api_key: TAVILY_API_KEY, query: searchQuery, max_results: 6, include_domains: ALLOWED_DOMAINS };

  let results = await tavilyRequest({ ...base, search_depth: "basic" });
  if (results.length) return results;

  // Sparse/empty basic search (can happen on noisy natural-language queries) —
  // retry deeper, then retry once more without the domain restriction, before
  // giving up. Better to widen the net than hand the consultant a dead end.
  results = await tavilyRequest({ ...base, search_depth: "advanced" });
  if (results.length) return results;

  results = await tavilyRequest({ api_key: TAVILY_API_KEY, query: searchQuery, max_results: 6, search_depth: "advanced" });
  return results;
}

// The consultant should be able to read the battlecard out loud verbatim, so
// the answer must be in the language the customer actually spoke. The client
// detects this per-query (Devanagari => HI, romanised Hindi words => HINGLISH).
const LANGUAGE_INSTRUCTIONS = {
  HINGLISH:
    'The buyer asked this in Hinglish (Hindi-English mix, Roman script). Write the "headline" and every bullet in the same natural, conversational Hinglish an Indian car sales consultant would speak — Hindi sentence flow in Roman script, keeping technical/car terms (on-road price, EMI, ADAS, airbags, mileage, resale value, warranty) in English. Use Roman/Latin script ONLY: even if the sources are written in Devanagari, transliterate — never output Devanagari characters. Do NOT answer in pure English or pure Hindi.',
  HI:
    'The buyer asked this in Hindi. Write the "headline" and every bullet in Hindi (Devanagari script), keeping technical/car terms (EMI, ADAS, on-road price) in English where that is how people naturally say them.',
  EN:
    'Write the "headline" and every bullet in English.',
};

async function synthesiseAnswer(query, sources, context, lang) {
  const sourceBlock = sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.url})\n${s.content}`)
    .join("\n\n");

  const contextBlock = context
    ? `Recent conversation so far (use this ONLY to resolve pronouns/references like "iska", "that one", "is car ka" — the question itself is what to answer):\n${context}\n\n`
    : "";

  const languageInstruction = LANGUAGE_INSTRUCTIONS[lang] || LANGUAGE_INSTRUCTIONS.EN;

  const prompt = `You are an AI sales assistant for a car dealership consultant. A buyer has asked or implied this question:
"${query}"

${contextBlock}Here is what live web search returned (use ONLY this information, never invent a spec, price, or fact):
${sourceBlock || "(no search results found)"}

Write a short, persuasive, sales-ready answer a consultant can say out loud, grounded strictly in the sources above.
${languageInstruction} The "category" value must always stay in English.

Respond as strict JSON, no markdown, matching this shape:
{
  "category": "one of: Comparison, Feature explainer, Price, Resale, Financing, Objection handling, Safety, Warranty, General",
  "headline": "one persuasive sentence summarising the answer",
  "bullets": ["3-4 short supporting bullet points, each a standalone sales-ready fact"],
  "confidence": 0.0-1.0 based on how well the sources actually covered the question
}`;

  // Gemini first, Groq as fallback — the free Gemini tier runs out of quota
  // (429) mid-demo, and a demo that answers via Groq beats one that falls
  // back to the offline mock dataset.
  if (GEMINI_API_KEY) {
    try {
      return await geminiSynthesise(prompt);
    } catch (err) {
      if (!GROQ_API_KEY) throw err;
      console.warn(`[synthesise] Gemini failed (${err.message}) — falling back to Groq`);
    }
  }
  if (!GROQ_API_KEY) throw new Error("no synthesis API key configured");
  return groqJson(prompt);
}

async function geminiSynthesise(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });
  const options = { method: "POST", headers: { "Content-Type": "application/json" }, body };

  let res = await fetch(url, options);
  if (res.status === 503) {
    // Gemini free tier occasionally reports transient overload — one quick retry clears most of these.
    await new Promise((r) => setTimeout(r, 700));
    res = await fetch(url, options);
  }
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return JSON.parse(text);
}

async function groqJson(prompt, model = "llama-3.3-70b-versatile") {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned no content");
  return JSON.parse(text);
}

// LLM-based doubt detection for listening mode — understands any phrasing in
// English/Hindi/Hinglish instead of matching keywords. Groq's 8B model first
// because detection must feel instant (~300ms); Gemini as backup.
function detectPrompt(text) {
  return `You are the doubt-detector for a car dealership's AI sales assistant, listening to a live showroom conversation between a sales consultant and a customer. Utterances may be English, Hindi, or Hinglish (Hindi in Roman script).

Utterance: "${text}"

Does this utterance contain a question, doubt, or information request a car sales consultant should answer — anything about car models, comparisons, features, price, EMI/finance, insurance, exchange, test drives, delivery, safety, mileage, resale, warranty, and so on? Statements of intent count too ("mujhe Innova ke baare mein janna hai"). Greetings, small talk, and the consultant's own filler statements are NOT doubts.

Reply as strict JSON, no markdown:
{"isDoubt": true or false, "question": "if isDoubt: the customer's ask rewritten as one clear standalone question in the SAME language/mix they used, else an empty string"}`;
}

app.post("/api/detect", async (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "text is required" });

  try {
    let result = null;
    if (GROQ_API_KEY) {
      try {
        result = await groqJson(detectPrompt(text), "llama-3.1-8b-instant");
      } catch (err) {
        if (!GEMINI_API_KEY) throw err;
        console.warn(`[/api/detect] Groq failed (${err.message}) — falling back to Gemini`);
      }
    }
    if (!result && GEMINI_API_KEY) result = await geminiSynthesise(detectPrompt(text));
    if (!result) throw new Error("no detection API key configured");
    res.json({ isDoubt: !!result.isDoubt, question: result.question || "" });
  } catch (err) {
    console.error("[/api/detect]", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.post("/api/answer", async (req, res) => {
  const query = (req.body?.query || "").trim();
  const context = (req.body?.context || "").trim() || null;
  const lang = (req.body?.lang || "EN").toUpperCase();
  if (!query) return res.status(400).json({ error: "query is required" });
  if ((!GEMINI_API_KEY && !GROQ_API_KEY) || !TAVILY_API_KEY) {
    return res.status(503).json({ error: "Server needs TAVILY_API_KEY plus GEMINI_API_KEY or GROQ_API_KEY" });
  }

  try {
    // Fold recent context into the search string too, not just the synthesis
    // prompt — otherwise a pronoun-only question ("iska resale value?") sends
    // Tavily a query with no car name in it at all and it searches blind.
    const searchQuery = context ? `${context} ${query}` : query;
    const sources = await tavilySearch(searchQuery);
    const answer = await synthesiseAnswer(query, sources, context, lang);
    answer.sources = sources.length
      ? sources.map((s) => `${new URL(s.url).hostname.replace("www.", "")} — ${s.title}`)
      : ["no live sources matched this query"];
    res.json(answer);
  } catch (err) {
    console.error("[/api/answer]", err.message);
    res.status(502).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CarCred demo server running on http://localhost:${PORT}`);
  if ((!GEMINI_API_KEY && !GROQ_API_KEY) || !TAVILY_API_KEY) {
    console.warn("Missing TAVILY_API_KEY or a synthesis key (GEMINI_API_KEY/GROQ_API_KEY) — /api/answer will return 503 until set.");
  }
});
