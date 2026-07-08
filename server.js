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
