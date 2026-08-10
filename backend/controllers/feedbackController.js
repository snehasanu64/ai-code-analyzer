const Feedback = require("../models/Feedback");

const submitFeedback = async (req, res, next) => {
  try {
    const { type, message, rating } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "message is required" });
    const feedback = await Feedback.create({ user: req.user._id, type, message, rating });
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitFeedback };
