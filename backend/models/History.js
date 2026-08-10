const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    analysis: { type: mongoose.Schema.Types.ObjectId, ref: "Analysis", required: true },
    action: { type: String, required: true },
    snippetPreview: { type: String },
    language: { type: String },
    isBookmarked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", historySchema);
