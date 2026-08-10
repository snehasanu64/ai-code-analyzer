/**
 * Google Claude provider stub.
 * Implement each method with a real call to the Claude API using ANTHROPIC_API_KEY.
 * Must resolve to the exact same shape as mockProvider.js so no other layer changes.
 */
const notImplemented = (method) => async () => {
  throw new Error(`Claude provider not yet implemented: ${method}(). Set AI_PROVIDER=mock or implement this method.`);
};

module.exports = {
  name: "claude",
  explainCode: notImplemented("explainCode"),
  findBugs: notImplemented("findBugs"),
  optimizeCode: notImplemented("optimizeCode"),
  complexityAnalysis: notImplemented("complexityAnalysis"),
  securityScan: notImplemented("securityScan"),
  generateDocumentation: notImplemented("generateDocumentation"),
  convertCode: notImplemented("convertCode"),
  learningMode: notImplemented("learningMode"),
};
