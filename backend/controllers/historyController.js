const History = require("../models/History");
const Analysis = require("../models/Analysis");
const Report = require("../models/Report");

// @route GET /api/history?type=&bookmarked=&search=
const getHistory = async (req, res, next) => {
  try {
    const { type, bookmarked, search, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.action = type;
    if (bookmarked === "true") filter.isBookmarked = true;
    if (search) filter.snippetPreview = { $regex: search, $options: "i" };

    const items = await History.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("analysis");

    const total = await History.countDocuments(filter);
    res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/history/:id/bookmark
const toggleBookmark = async (req, res, next) => {
  try {
    const item = await History.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "History item not found" });
    item.isBookmarked = !item.isBookmarked;
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/history/:id
const deleteHistoryItem = async (req, res, next) => {
  try {
    const item = await History.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "History item not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/history/:analysisId/report
const saveAsReport = async (req, res, next) => {
  try {
    const { title, format = "pdf" } = req.body;
    const analysis = await Analysis.findOne({ _id: req.params.analysisId, user: req.user._id });
    if (!analysis) return res.status(404).json({ success: false, message: "Analysis not found" });
    const report = await Report.create({ user: req.user._id, analysis: analysis._id, title: title || `${analysis.type} report`, format });
    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/history/reports
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("analysis");
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHistory, toggleBookmark, deleteHistoryItem, saveAsReport, getReports };
