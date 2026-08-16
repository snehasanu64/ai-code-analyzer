require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const connectDB = require("./config/db");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const bugRoutes = require("./routes/bugRoutes");
const optimizationRoutes = require("./routes/optimizationRoutes");
const complexityRoutes = require("./routes/complexityRoutes");
const securityRoutes = require("./routes/securityRoutes");
const documentationRoutes = require("./routes/documentationRoutes");
const conversionRoutes = require("./routes/conversionRoutes");
const learningRoutes = require("./routes/learningRoutes");
const historyRoutes = require("./routes/historyRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "AI Code Analyzer API", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/bugs", bugRoutes);
app.use("/api/optimize", optimizationRoutes);
app.use("/api/complexity", complexityRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/docs", documentationRoutes);
app.use("/api/convert", conversionRoutes);
app.use("/api/learn", learningRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/chat", chatRoutes);

// Serve static frontend assets in production (Full-stack single server deployment)
const frontendDist = path.join(__dirname, "../frontend/dist");
if (require("fs").existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] AI Code Analyzer API running on port ${PORT}`));

module.exports = app;
