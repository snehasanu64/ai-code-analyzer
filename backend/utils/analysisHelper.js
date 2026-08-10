const aiService = require("../services/aiService");
const Analysis = require("../models/Analysis");
const History = require("../models/History");

// Shared persistence logic used by every analysis-type controller
const saveAnalysis = async ({ user, project, type, language, targetLanguage, level, code, result, provider, durationMs }) => {
  const scores = aiService.computeScores(code);
  const analysis = await Analysis.create({
    user,
    project: project || undefined,
    type,
    language,
    targetLanguage,
    explanationLevel: level,
    sourceCode: code,
    result,
    scores,
    provider,
    durationMs,
  });
  await History.create({
    user,
    analysis: analysis._id,
    action: type,
    snippetPreview: code.slice(0, 140),
    language,
  });
  return analysis;
};

module.exports = { saveAnalysis };
