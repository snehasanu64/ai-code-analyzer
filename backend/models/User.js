const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    avatar: { type: String, default: "" },
    plan: { type: String, enum: ["free", "pro", "team"], default: "free" },
    apiUsage: {
      count: { type: Number, default: 0 },
      resetAt: { type: Date, default: Date.now },
    },
    preferences: {
      theme: { type: String, enum: ["dark", "light"], default: "dark" },
      defaultExplanationLevel: { type: String, enum: ["beginner", "intermediate", "expert"], default: "intermediate" },
      editorFontSize: { type: Number, default: 14 },
    },
    workspaceKeys: {
      provider: { type: String, enum: ["mock", "openai", "gemini"], default: "mock" },
      model: { type: String, default: "" },
      encryptedKey: { type: String, select: false },
      keyPreview: { type: String, default: "" }, // masked, safe to return to the client
      updatedAt: { type: Date },
    },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
