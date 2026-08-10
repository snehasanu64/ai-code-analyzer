const express = require("express");
const router = express.Router();
const { generateCodeFromPrompt } = require("../controllers/chatController");

router.post("/generate", generateCodeFromPrompt);

module.exports = router;
