const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { attachAiConfig } = require("../middleware/aiConfig");
const { convert } = require("../controllers/conversionController");

router.use(protect, attachAiConfig);
router.post("/", convert);

module.exports = router;
