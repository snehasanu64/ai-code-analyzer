const aiService = require("../services/aiService");
const { saveAnalysis } = require("../utils/analysisHelper");

const analyzeComplexity = async (req, res, next) => {
  try {
    const { code, language, projectId } = req.body;
    if (!code || !language) return res.status(400).json({ success: false, message: "code and language are required" });
    const { result, provider, durationMs, warning } = await aiService.complexityAnalysis({ code, language, aiConfig: req.aiConfig });
    const analysis = await saveAnalysis({ user: req.user._id, project: projectId, type: "complexity", language, code, result, provider, durationMs });
    res.json({ success: true, analysis, warning });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzeComplexity };
