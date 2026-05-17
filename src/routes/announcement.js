const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

router.post("/", async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    const announcement = await Announcement.create({
      user_id,
      title,
      message,
      type,
    });

    const io = req.app.get("io");

    io.emit("announcement", announcement);

    res.json({ message: "Announcement created", announcement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
