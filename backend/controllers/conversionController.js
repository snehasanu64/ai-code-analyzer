const aiService = require("../services/aiService");
const { saveAnalysis } = require("../utils/analysisHelper");

const convert = async (req, res, next) => {
  try {
    const { code, fromLanguage, toLanguage, language, targetLanguage, projectId } = req.body;
    const fromLang = fromLanguage || language;
    const toLang = toLanguage || targetLanguage;

    if (!code || !fromLang || !toLang) {
      return res.status(400).json({ success: false, message: "code, fromLanguage and toLanguage are required" });
    }
    const { result, provider, durationMs, warning } = await aiService.convertCode({ code, fromLanguage: fromLang, toLanguage: toLang, aiConfig: req.aiConfig });
    const analysis = await saveAnalysis({ user: req.user._id, project: projectId, type: "conversion", language: fromLang, targetLanguage: toLang, code, result, provider, durationMs });
    res.json({ success: true, analysis, warning });
  } catch (err) {
    next(err);
  }
};

module.exports = { convert };
