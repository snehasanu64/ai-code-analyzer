const aiService = require("../services/aiService");
const { saveAnalysis } = require("../utils/analysisHelper");

const learn = async (req, res, next) => {
  try {
    const { code, language, mode, projectId } = req.body;
    if (!code || !language) return res.status(400).json({ success: false, message: "code and language are required" });
    const { result, provider, durationMs, warning } = await aiService.learningMode({ code, language, mode, aiConfig: req.aiConfig });
    const analysis = await saveAnalysis({ user: req.user._id, project: projectId, type: "learning", language, code, result, provider, durationMs });
    res.json({ success: true, analysis, warning });
  } catch (err) {
    next(err);
  }
};

module.exports = { learn };
