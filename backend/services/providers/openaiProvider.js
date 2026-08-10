/**
 * Real OpenAI provider. Requires a per-request apiKey (the user's own key,
 * decrypted from their account by aiService.js). If no key is supplied, every
 * method throws — aiService.js then automatically falls back to the mock provider.
 */
const { buildPrompt, callOpenAI } = require("./llmHelper");

const makeMethod = (name) => async (args) => {
  if (!args.apiKey) throw new Error("No OpenAI API key configured for this user.");
  const { system, user } = buildPrompt(name, args);
  return callOpenAI({ apiKey: args.apiKey, model: args.model, system, user });
};

module.exports = {
  name: "openai",
  explainCode: makeMethod("explainCode"),
  findBugs: makeMethod("findBugs"),
  optimizeCode: makeMethod("optimizeCode"),
  complexityAnalysis: makeMethod("complexityAnalysis"),
  securityScan: makeMethod("securityScan"),
  generateDocumentation: makeMethod("generateDocumentation"),
  convertCode: makeMethod("convertCode"),
  learningMode: makeMethod("learningMode"),
};
