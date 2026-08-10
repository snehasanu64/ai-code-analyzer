const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");

// @route POST /api/upload — accepts a code file, returns its text content + detected language
router.post("/", protect, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  const content = fs.readFileSync(req.file.path, "utf-8");
  fs.unlink(req.file.path, () => {}); // clean up temp file after reading

  const extToLang = {
    ".js": "javascript", ".jsx": "javascript", ".ts": "typescript", ".tsx": "typescript",
    ".py": "python", ".java": "java", ".c": "c", ".cpp": "cpp", ".php": "php",
    ".html": "html", ".css": "css", ".sql": "sql", ".txt": "plaintext",
  };
  const ext = path.extname(req.file.originalname).toLowerCase();

  res.json({
    success: true,
    data: {
      filename: req.file.originalname,
      size: req.file.size,
      language: extToLang[ext] || "plaintext",
      content,
    },
  });
});

module.exports = router;
