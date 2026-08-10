const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    analysis: { type: mongoose.Schema.Types.ObjectId, ref: "Analysis", required: true },
    title: { type: String, required: true },
    format: { type: String, enum: ["pdf", "json", "markdown"], default: "pdf" },
    filePath: { type: String },
    isSaved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
