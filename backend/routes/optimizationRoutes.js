const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { optimize } = require("../controllers/optimizationController");

router.use(protect, attachAiConfig);
router.post("/", optimize);

module.exports = router;
