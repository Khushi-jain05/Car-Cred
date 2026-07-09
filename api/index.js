// Vercel serverless entry point. vercel.json rewrites /api/* to this function;
// the Express app then routes the original URL (/api/answer, /api/detect).
module.exports = require("../server.js");
