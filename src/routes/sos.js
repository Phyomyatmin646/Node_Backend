const express = require("express");
const router = express.Router();
const SosAlert = require("../models/SosAlert");

// create SOS
router.post("/", async (req, res) => {
  try {
    const { resident_id, room_id, message } = req.body;

    const sos = await SosAlert.create({
      resident_id,
      room_id,
      message,
    });

    const io = req.app.get("io");

    // 🔥 broadcast to all security/admin
    io.emit("sos_alert", sos);

    res.json({ message: "SOS triggered", sos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
