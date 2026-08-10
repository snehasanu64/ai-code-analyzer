const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { detectBugs } = require("../controllers/bugController");

router.use(protect, attachAiConfig);
router.post("/detect", detectBugs);

module.exports = router;
