const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { generateDocs } = require("../controllers/documentationController");

router.use(protect, attachAiConfig);
router.post("/generate", generateDocs);

module.exports = router;
