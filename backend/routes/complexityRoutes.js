const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { analyzeComplexity } = require("../controllers/complexityController");

router.use(protect, attachAiConfig);
router.post("/", analyzeComplexity);

module.exports = router;
