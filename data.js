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
  {
    id: "adas-level",
    category: "Feature explainer",
    chip: "ADAS L1 vs L2",
    question: {
      en: "What's the actual difference between ADAS Level 1 and Level 2?",
      hi: "ADAS Level 1 aur Level 2 mein kya real difference hai?",
      keywords: ["adas", "level 1", "level 2", "l1", "l2", "advanced driver", "assist"],
    },
    answer: {
      headline: "Level 1 assists with one task at a time; Level 2 combines steering + speed control so the car can actively hold lane and distance together.",
      bullets: [
        "Level 1 (e.g. adaptive cruise control OR lane-keep alone): the system handles a single axis of control — either braking/accelerating, or steering — never both at once.",
        "Level 2 (e.g. lane-centering + adaptive cruise together): the car simultaneously steers and manages speed, so it can track a curving highway lane while holding a safe following distance.",
        "Driver is still fully responsible at both levels — hands-on-wheel monitoring is usually enforced by the system itself.",
        "Practical sales point: Level 2 is the bigger jump in daily highway comfort, not just a spec-sheet bump — worth the price step for customers who highway-commute often.",
      ],
      sources: ["sae.org — levels of driving automation", "manufacturer ADAS brochure (allow-listed)", "carwale.com — ADAS explainer"],
      confidence: 0.88,
    },
  },
  {
    id: "on-road-price",
    category: "Price",
    chip: "On-road price",
    question: {
      en: "What's the on-road price of the Grand Vitara top variant in Pune?",
      hi: "Grand Vitara ke top variant ka Pune mein on-road price kya hai?",
      keywords: ["on-road", "onroad", "price", "cost", "pune", "grand vitara", "kitna"],
    },
    answer: {
      headline: "Grand Vitara Alpha+ (Strong Hybrid, AT) on-road in Pune comes to roughly ₹22.4L, including RTO, insurance and cess.",
      bullets: [
        "Ex-showroom: ~₹19.9L",
        "RTO + registration: ~₹1.6L",
        "Comprehensive insurance (1st year): ~₹65k",
        "Handling & extended warranty (optional): ~₹25k",
        "Figures move with monthly RTO/insurance revisions — always confirm same-day before quoting a customer.",
      ],
      sources: ["marutisuzuki.com — price list", "cardekho.com — on-road price calculator, Pune RTO"],
      confidence: 0.85,
    },
  },
  {
    id: "resale-value",
    category: "Resale",
    chip: "Resale value",
    question: {
      en: "How well does the XUV700 hold resale value after 5 years?",
      hi: "5 saal baad XUV700 ki resale value kaisi rehti hai?",
      keywords: ["resale", "5 year", "value", "xuv700", "second hand", "used", "depreciation"],
    },
    answer: {
      headline: "XUV700 typically retains ~55–60% of ex-showroom price at 5 years — one of the stronger resale curves in the mid-size SUV segment.",
      bullets: [
        "Strong demand in the used-SUV market keeps depreciation slower than hatchbacks/sedans in the same price band.",
        "AX7 variants with ADAS hold value slightly better than base trims — a good upsell angle for budget-conscious buyers worried about resale.",
        "Well-documented service history at authorized centers adds a further 3–5% at resale.",
      ],
      sources: ["mahindra.com — model page", "cars24.com — used SUV valuation trends", "cardekho.com — depreciation report"],
      confidence: 0.82,
    },
  },
];
