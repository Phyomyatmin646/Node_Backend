const express = require("express");
const router = express.Router();
const ResParking = require("../models/ResParking");

router.post("/", async (req, res) => {
  try {
    const { room_id, slot_number, status } = req.body;

    if (!room_id || !slot_number) {
      return res.status(400).json({
        success: false,
        message: "room_id and slot_number are required",
      });
    }

    const parking = await ResParking.create({
      room_id,
      slot_number,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Residential parking created successfully",
      data: parking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const parking = await ResParking.find()
      .populate("room_id")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: parking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const parking = await ResParking.findById(req.params.id).populate(
      "room_id",
    );

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Residential parking not found",
      });
    }

    res.json({ success: true, data: parking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { room_id, slot_number, status } = req.body;

    const parking = await ResParking.findByIdAndUpdate(
      req.params.id,
      { room_id, slot_number, status },
      { new: true, runValidators: true },
    );

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Residential parking not found",
      });
    }

    res.json({
      success: true,
      message: "Residential parking updated successfully",
      data: parking,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const parking = await ResParking.findByIdAndDelete(req.params.id);

    if (!parking) {
      return res.status(404).json({
        success: false,
        message: "Residential parking not found",
      });
    }

    res.json({
      success: true,
      message: "Residential parking deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
