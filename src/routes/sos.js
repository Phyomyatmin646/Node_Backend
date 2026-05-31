const express = require("express");
const router = express.Router();
const SosAlert = require("../models/SosAlert");

// list alerts, optionally filtered by status
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const alerts = await SosAlert.find(filter)
      .sort({ created_at: -1 })
      .populate("resident_id", "name email") // optional
      .populate("room_id", "room_name");

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// optional: update alert status
router.put("/:id", async (req, res) => {
  try {
    const allowed = {};
    if (req.body.status) allowed.status = req.body.status;
    if (req.body.resolved_at) allowed.resolved_at = req.body.resolved_at;

    const updated = await SosAlert.findByIdAndUpdate(req.params.id, allowed, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "SOS alert not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
