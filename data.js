// Demo dataset — mocked "live retrieval" results for the AI Sales Assistant demo.
// Replace models/questions/sources here with CarCred's real inventory & sources
// before the client meeting. In production this content is fetched live per
// proposal section 3.1 ("Retrieve" / "Synthesise"), not hard-coded.

const DEMO_SCENARIOS = [
  {
    id: "compare-creta-nexon",
    category: "Comparison",
    chip: "Creta vs Nexon",
    question: {
      en: "Hyundai Creta vs Tata Nexon — which one should I buy?",
      hi: "Hyundai Creta ya Tata Nexon, kaunsi gaadi lena chahiye?",
      keywords: ["creta", "nexon", "compare", "vs", "which", "better", "kaunsi", "lena"],
    },
    answer: {
      headline: "Both are strong picks — the right call depends on what the customer values most: space & refinement (Creta) or safety & value (Nexon).",
      bullets: [
        "Space & ride: Creta's longer wheelbase gives noticeably more rear legroom and a more composed highway ride — a strong pitch for family buyers.",
        "Safety: Nexon carries a 5-star Global NCAP rating with 6 airbags on most variants as standard — a strong close for safety-conscious buyers.",
        "On-road price: Nexon's top variants typically undercut equivalent Creta trims by ₹80k–₹1.2L — a strong lever if price is the objection.",
        "Resale: Creta holds slightly stronger resale in the 3–5 year window due to brand pull and higher used-market demand.",
      ],
      sources: ["hyundai.com — Creta spec sheet", "tatamotors.com — Nexon spec sheet", "cardekho.com — price comparison", "globalncap.org — safety ratings"],
      confidence: 0.91,
    },
  },
];
