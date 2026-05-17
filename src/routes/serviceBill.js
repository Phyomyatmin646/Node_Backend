const express = require("express");
const router = express.Router();
const ServiceBill = require("../models/ServiceBill");

router.post("/", async (req, res) => {
  try {
    const bill = await ServiceBill.create(req.body);

    const io = req.app.get("io");

    io.emit("bill_update", bill);

    res.json({ message: "Bill created", bill });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const bill = await ServiceBill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    const io = req.app.get("io");

    io.emit("bill_update", bill);

    res.json({ message: "Bill updated", bill });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
