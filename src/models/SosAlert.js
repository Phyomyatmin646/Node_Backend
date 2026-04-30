const mongoose = require("mongoose");

const SosAlertSchema = new mongoose.Schema({
  resident_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["Active", "Resolved"], default: "Active" },
  created_at: { type: Date, default: Date.now },
  resolved_at: { type: Date },
});

module.exports = mongoose.model("SosAlert", SosAlertSchema);