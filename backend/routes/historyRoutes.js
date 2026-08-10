const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getHistory, toggleBookmark, deleteHistoryItem, saveAsReport, getReports } = require("../controllers/historyController");

router.use(protect);
router.get("/", getHistory);
router.get("/reports", getReports);
router.patch("/:id/bookmark", toggleBookmark);
router.delete("/:id", deleteHistoryItem);
router.post("/:analysisId/report", saveAsReport);

module.exports = router;
