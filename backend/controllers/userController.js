const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { encrypt, maskKey } = require("../utils/crypto");

const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, preferences } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (preferences) user.preferences = { ...user.preferences.toObject(), ...preferences };
    await user.save();
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/users/workspace-keys — never returns the raw key, only a masked preview
const getWorkspaceKeys = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      workspaceKeys: {
        provider: user.workspaceKeys?.provider || "mock",
        model: user.workspaceKeys?.model || "",
        keyPreview: user.workspaceKeys?.keyPreview || "",
        hasKey: !!user.workspaceKeys?.keyPreview,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/users/workspace-keys
const saveWorkspaceKeys = async (req, res, next) => {
  try {
    const { provider, model, apiKey } = req.body;
    if (!["mock", "openai", "gemini"].includes(provider)) {
      return res.status(400).json({ success: false, message: "provider must be one of mock, openai, gemini" });
    }
    const user = await User.findById(req.user._id);

    if (provider === "mock") {
      user.workspaceKeys = { provider: "mock", model: "", encryptedKey: undefined, keyPreview: "", updatedAt: new Date() };
    } else {
      // Keep the existing key if the user didn't type a new one (e.g. just switching the model)
      const trimmedKey = (apiKey || "").trim();
      if (trimmedKey) {
        user.workspaceKeys = {
          provider,
          model: model || "",
          encryptedKey: encrypt(trimmedKey),
          keyPreview: maskKey(trimmedKey),
          updatedAt: new Date(),
        };
      } else {
        user.workspaceKeys.provider = provider;
        user.workspaceKeys.model = model || user.workspaceKeys.model || "";
        user.workspaceKeys.updatedAt = new Date();
      }
    }

    await user.save();
    res.json({
      success: true,
      workspaceKeys: {
        provider: user.workspaceKeys.provider,
        model: user.workspaceKeys.model,
        keyPreview: user.workspaceKeys.keyPreview,
        hasKey: !!user.workspaceKeys.keyPreview,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, changePassword, getWorkspaceKeys, saveWorkspaceKeys };
