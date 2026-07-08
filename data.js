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
  {
    id: "financing-emi",
    category: "Financing",
    chip: "EMI options",
    question: {
      en: "What EMI options are available if the customer can only put down 10%?",
      hi: "Agar customer sirf 10% down payment de sake to EMI options kya honge?",
      keywords: ["emi", "down payment", "finance", "loan", "10%", "instalment"],
    },
    answer: {
      headline: "At 10% down, most PSU and NBFC partners will still finance up to 90% on-road for salaried buyers with a clean CIBIL score — EMI tenures typically run 5–7 years.",
      bullets: [
        "Example: on a ₹15L on-road car, 10% down (₹1.5L) leaves ₹13.5L financed — roughly ₹22,500/month at 9.5% for 7 years.",
        "Shorter tenure (5 yrs) raises the EMI to ~₹28,200/month but saves ~₹1.4L in total interest — worth mentioning for cost-conscious buyers.",
        "Zero-dep insurance add-on is worth bundling into the loan when down payment is low, since equity in the car is thinner early on.",
      ],
      sources: ["bank/NBFC published rate cards (illustrative)", "dealership finance desk reference sheet"],
      confidence: 0.8,
    },
  },
  {
    id: "mileage-objection",
    category: "Objection handling",
    chip: "Mileage objection",
    question: {
      en: "Customer says the mileage is too low compared to the competitor — what do I say?",
      hi: "Customer keh raha hai mileage kam hai competitor se, kya jawab dena chahiye?",
      keywords: ["mileage", "low", "kam", "objection", "fuel efficiency", "competitor"],
    },
    answer: {
      headline: "Reframe from claimed mileage to real-world cost-per-km, and bring in the segment-specific strengths that offset the fuel bill.",
      bullets: [
        "Certified mileage figures are tested under standard cycles — real-world mileage gaps between competing SUVs in this segment are usually within 1–1.5 km/l.",
        "At ~12,000 km/year, a 1.5 km/l gap costs roughly ₹3,500–4,500/year at current fuel prices — a small number against the car's other advantages.",
        "Pivot to what the customer actually cares about behind the mileage question — usually running cost or resale — and answer that directly with the resale/financing data on hand.",
      ],
      sources: ["ARAI test cycle documentation", "internal objection-handling playbook (to be supplied by CarCred)"],
      confidence: 0.78,
    },
  },
];
