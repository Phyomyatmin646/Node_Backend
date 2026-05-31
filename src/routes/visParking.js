const express = require("express");
const router = express.Router();
const VisParking = require("../models/VisParking");

router.post("/", async (req, res) => {
  try {
    const { slot_number, status } = req.body;

    if (!slot_number) {
      return res.status(400).json({
        success: false,
        message: "slot_number is required",
      });
    }

    const parking = await VisParking.create({
      slot_number,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Visitor parking created successfully",
      data: parking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const parking = await VisParking.find().sort({ createdAt: -1 });

    res.json({ success: true, data: parking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const parking = await VisParking.findById(req.params.id);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Visitor parking not found",
      });
    }

    res.json({ success: true, data: parking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { slot_number, status } = req.body;

    const parking = await VisParking.findByIdAndUpdate(
      req.params.id,
      { slot_number, status },
      { new: true, runValidators: true },
    );

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Visitor parking not found",
      });
    }

    res.json({
      success: true,
      message: "Visitor parking updated successfully",
      data: parking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const parking = await VisParking.findByIdAndDelete(req.params.id);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Visitor parking not found",
      });
    }

    res.json({
      success: true,
      message: "Visitor parking deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
