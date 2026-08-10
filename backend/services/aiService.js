/**
 * Central AI service layer.
 * Controllers only ever import this file — never a provider directly.
 *
 * Provider resolution order per request:
 *   1. aiConfig.provider from the calling user's saved Workspace Keys (if set and not "mock")
 *   2. AI_PROVIDER from .env (global default, usually "mock")
 *   3. mockProvider as the final fallback
 *
 * If a real provider throws (missing/invalid key, network error, bad JSON, etc.),
 * the mock provider is used instead so the app never breaks — the response includes
 * a `warning` field so the frontend/API can surface that the real call failed.
 */
const mockProvider = require("./providers/mockProvider");
const geminiProvider = require("./providers/geminiProvider");
const openaiProvider = require("./providers/openaiProvider");
const claudeProvider = require("./providers/claudeProvider");

const providers = {
  mock: mockProvider,
  gemini: geminiProvider,
  openai: openaiProvider,
  claude: claudeProvider,
};

function getProvider(aiConfig) {
  let requested = (aiConfig?.provider || process.env.AI_PROVIDER || "mock").toLowerCase();
  if (requested === "mock" && (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)) {
    requested = process.env.GEMINI_API_KEY ? "gemini" : "openai";
  }
  return providers[requested] || mockProvider;
}

// Wraps a provider call with timing + graceful fallback to mock on failure
async function run(method, args) {
  const { aiConfig, ...rest } = args;
  const provider = getProvider(aiConfig);
  const apiKey =
    aiConfig?.apiKey ||
    (provider.name === "gemini"
      ? process.env.GEMINI_API_KEY
      : provider.name === "openai"
      ? process.env.OPENAI_API_KEY
      : undefined);
  const start = Date.now();
  try {
    const result = await provider[method]({ ...rest, apiKey, model: aiConfig?.model });
    return { result, provider: provider.name, durationMs: Date.now() - start };
  } catch (err) {
    if (provider.name !== "mock") {
      const fallback = await mockProvider[method](rest);
      return { result: fallback, provider: "mock (fallback)", durationMs: Date.now() - start, warning: err.message };
    }
    throw err;
  }
}

const computeScores = (code) => ({
  quality: mockProvider.scoreFromCode(code, 1),
  performance: mockProvider.scoreFromCode(code, 2),
  security: mockProvider.scoreFromCode(code, 3),
  maintainability: mockProvider.scoreFromCode(code, 4),
});

module.exports = {
  explainCode: (args) => run("explainCode", args),
  findBugs: (args) => run("findBugs", args),
  optimizeCode: (args) => run("optimizeCode", args),
  complexityAnalysis: (args) => run("complexityAnalysis", args),
  securityScan: (args) => run("securityScan", args),
  generateDocumentation: (args) => run("generateDocumentation", args),
  convertCode: (args) => run("convertCode", args),
  learningMode: (args) => run("learningMode", args),
  computeScores,
};
