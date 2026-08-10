const aiService = require("../services/aiService");
const { saveAnalysis } = require("../utils/analysisHelper");

const convert = async (req, res, next) => {
  try {
    const { code, fromLanguage, toLanguage, projectId } = req.body;
    if (!code || !fromLanguage || !toLanguage) {
      return res.status(400).json({ success: false, message: "code, fromLanguage and toLanguage are required" });
    }
    const { result, provider, durationMs, warning } = await aiService.convertCode({ code, fromLanguage, toLanguage, aiConfig: req.aiConfig });
    const analysis = await saveAnalysis({ user: req.user._id, project: projectId, type: "conversion", language: fromLanguage, targetLanguage: toLanguage, code, result, provider, durationMs });
    res.json({ success: true, analysis, warning });
  } catch (err) {
    next(err);
  }
};

module.exports = { convert };
