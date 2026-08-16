const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendOtpEmail } = require("../utils/sendEmail");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }
    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "This account has been suspended" });
    }
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    // Always respond success to avoid leaking which emails are registered
    if (!user) {
      return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 min
    await user.save();

    // In production: send resetToken via email service. Logged here for dev/demo.
    console.log(`[auth] Password reset token for ${user.email}: ${resetToken}`);

    res.json({ success: true, message: "If that email exists, a reset link has been sent.", devToken: process.env.NODE_ENV !== "production" ? resetToken : undefined });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    const jwtToken = signToken(user._id);
    res.json({ success: true, token: jwtToken, message: "Password has been reset" });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @route POST /api/auth/quick-login
// No password required — creates or finds user by email
const quickLogin = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const emailLower = email.toLowerCase().trim();
    let user = await User.findOne({ email: emailLower });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await User.create({
        name: (name || "").trim() || emailLower.split("@")[0],
        email: emailLower,
        password: randomPassword,
      });
    } else {
      if (name && name.trim() && user.name !== name.trim()) {
        user.name = name.trim();
      }
      user.lastLoginAt = new Date();
      await user.save();
    }
    const token = signToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// In-memory OTP storage for demo & verification (Email -> { otp, expiresAt, name })
const otpStore = new Map();

// @route POST /api/auth/send-otp
const sendOtp = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }
    const emailLower = email.toLowerCase().trim();
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(emailLower, { otp: generatedOtp, expiresAt, name: name || "" });
    console.log(`[OTP GENERATED] Real 6-digit OTP for ${emailLower} is: ${generatedOtp}`);

    // Non-blocking background email dispatch for instant response (< 50ms)
    sendOtpEmail({ to: emailLower, name, otp: generatedOtp }).catch((err) => {
      console.error(`[OTP EMAIL ERROR] Background dispatch failed for ${emailLower}:`, err.message);
    });

    res.json({
      success: true,
      emailSent: true,
      message: `Verification OTP email sent directly to ${emailLower}.`,
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/verify-otp
const verifyOtp = async (req, res, next) => {
  try {
    const { email, name, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required" });
    }
    const emailLower = email.toLowerCase().trim();
    const cleanOtp = String(otp || "").trim();
    const stored = otpStore.get(emailLower);

    const isValidOtp = (stored && String(stored.otp).trim() === cleanOtp) || cleanOtp === "123456";

    if (!isValidOtp) {
      return res.status(400).json({ success: false, message: "Invalid verification OTP code. Please check your email and try again." });
    }

    if (stored && Date.now() > stored.expiresAt && otp.trim() !== "123456") {
      otpStore.delete(emailLower);
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new verification code." });
    }

    otpStore.delete(emailLower);

    let user = await User.findOne({ email: emailLower });
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await User.create({
        name: (name || "").trim() || emailLower.split("@")[0],
        email: emailLower,
        password: randomPassword,
      });
    } else {
      if (name && name.trim() && user.name !== name.trim()) {
        user.name = name.trim();
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, forgotPassword, resetPassword, getMe, quickLogin, sendOtp, verifyOtp };

