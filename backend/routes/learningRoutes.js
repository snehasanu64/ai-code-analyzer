const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { learn } = require("../controllers/learningController");

router.use(protect, attachAiConfig);
router.post("/", learn);

module.exports = router;
