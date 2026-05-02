const express = require("express");
const router = express.Router();
const SosAlert = require("../models/SosAlert");

// OPTIONAL: manual trigger API (admin only)
router.post("/", async (req, res) => {
  try {
    const { resident_id, room_id, message } = req.body;

    if (!resident_id || !room_id || !message) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const sos = await SosAlert.create({
      resident_id,
      room_id,
      message,
    });

    res.json({
      success: true,
      message: "Saved (MQTT handles realtime)",
      data: sos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
