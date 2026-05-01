const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/read", protect, async (req, res) => {
  try {
    const noti = await Notification.findById(req.params.id);
    noti.isRead = true;
    await noti.save();
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
