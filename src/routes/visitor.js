const express = require("express");
const router = express.Router();
const Visitor = require("../models/Visitor");

router.post("/checkin", async (req, res) => {
  try {
    const visitor = await Visitor.create(req.body);

    const io = req.app.get("io");

    io.emit("visitor_checkin", visitor);

    res.json({ message: "Visitor checked in", visitor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/checkout/:id", async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { check_out_time: new Date() },
      { new: true },
    );

    const io = req.app.get("io");

    io.emit("visitor_checkout", visitor);

    res.json({ message: "Visitor checked out", visitor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
