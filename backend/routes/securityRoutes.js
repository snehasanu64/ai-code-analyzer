const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { scanSecurity } = require("../controllers/securityController");

router.use(protect, attachAiConfig);
router.post("/scan", scanSecurity);

module.exports = router;
