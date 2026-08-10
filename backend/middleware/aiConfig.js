const User = require("../models/User");
const { decrypt } = require("../utils/crypto");

/**
 * Runs after `protect`. Loads the current user's saved Workspace Keys
 * (decrypting the API key if present) and attaches it as req.aiConfig,
 * so analysis controllers can pass it straight through to aiService.
 * Never throws — any decryption failure just falls back to { provider: "mock" }.
 */
const attachAiConfig = async (req, res, next) => {
  try {
    const envProvider = (process.env.AI_PROVIDER || "").toLowerCase();
    if (envProvider && envProvider !== "mock") {
      const apiKey = envProvider === "gemini"
        ? process.env.GEMINI_API_KEY
        : envProvider === "openai"
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY;
      req.aiConfig = { provider: envProvider, apiKey };
      return next();
    }

    const user = await User.findById(req.user._id).select("+workspaceKeys.encryptedKey");
    const wk = user?.workspaceKeys;
    if (!wk || wk.provider === "mock" || !wk.encryptedKey) {
      req.aiConfig = { provider: "mock" };
      return next();
    }
    const apiKey = decrypt(wk.encryptedKey);
    req.aiConfig = { provider: wk.provider, model: wk.model, apiKey };
    next();
  } catch (err) {
    req.aiConfig = { provider: "mock" };
    next();
  }
};

module.exports = { attachAiConfig };
