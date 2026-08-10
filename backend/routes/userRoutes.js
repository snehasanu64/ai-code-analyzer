const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getProfile, updateProfile, changePassword, getWorkspaceKeys, saveWorkspaceKeys } = require("../controllers/userController");

router.use(protect);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.get("/workspace-keys", getWorkspaceKeys);
router.put("/workspace-keys", saveWorkspaceKeys);

module.exports = router;
