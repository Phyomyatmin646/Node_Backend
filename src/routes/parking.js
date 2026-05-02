const express = require("express");
const router = express.Router();
const ResParking = require("../models/ResParking");

// OPTIONAL manual API
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status required" });
    }

    const parking = await ResParking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!parking) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      success: true,
      message: "Updated (MQTT handles realtime)",
      data: parking,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
