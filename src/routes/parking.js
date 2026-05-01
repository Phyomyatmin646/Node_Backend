const express = require("express");
const router = express.Router();
const ResParking = require("../models/ResParking");

router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const parking = await ResParking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    const io = req.app.get("io");

    io.emit("parking_update", parking);

    res.json({ message: "Parking updated", parking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
