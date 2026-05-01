const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

router.post("/send", async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    const noti = await Notification.create({
      user_id,
      title,
      message,
      type,
    });

    const io = req.app.get("io");
    const users = req.app.get("onlineUsers");

    const socketId = users[user_id];

    if (socketId) {
      io.to(socketId).emit("notification", noti);
    }

    res.json({ message: "Notification sent", noti });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
