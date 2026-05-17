const express = require("express");
const router = express.Router();
const HelperRequest = require("../models/HelperRequest");

router.post("/", async (req, res) => {
  try {
    const request = await HelperRequest.create(req.body);

    const io = req.app.get("io");

    io.emit("helper_request", request);

    res.json({ message: "Helper requested", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const request = await HelperRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    const io = req.app.get("io");

    io.emit("helper_request", request);

    res.json({ message: "Request updated", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
