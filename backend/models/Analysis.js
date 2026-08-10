const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    type: {
      type: String,
      enum: [
        "explain",
        "bugs",
        "optimize",
        "documentation",
        "complexity",
        "security",
        "conversion",
        "learning",
      ],
      required: true,
    },
    language: { type: String, required: true },
    targetLanguage: { type: String }, // for conversion
    explanationLevel: { type: String, enum: ["beginner", "intermediate", "expert"], default: "intermediate" },
    sourceCode: { type: String, required: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    scores: {
      quality: { type: Number, min: 0, max: 100 },
      performance: { type: Number, min: 0, max: 100 },
      security: { type: Number, min: 0, max: 100 },
      maintainability: { type: Number, min: 0, max: 100 },
    },
    provider: { type: String, default: "mock" },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

analysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Analysis", analysisSchema);
