const express = require("express");
const router = express.Router();
const Report = require("../models/Report");

router.post("/", async (req, res) => {
  try {
    const report = await Report.create(req.body);

    const io = req.app.get("io");

    io.emit("report_update", report);

    res.json({ message: "Report submitted", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    const io = req.app.get("io");

    io.emit("report_update", report);

    res.json({ message: "Report updated", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
