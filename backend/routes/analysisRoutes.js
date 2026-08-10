const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { explain } = require("../controllers/analysisController");

router.use(protect, attachAiConfig);
router.post("/explain", explain);

module.exports = router;
