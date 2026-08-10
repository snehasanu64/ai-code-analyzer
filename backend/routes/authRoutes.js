const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, getMe, quickLogin } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/quick-login", quickLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);

module.exports = router;
