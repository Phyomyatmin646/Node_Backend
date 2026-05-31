const mongoose = require("mongoose");

const SosAlertSchema = new mongoose.Schema({
  resident_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },

  message: {
    type: String,
    required: true,
    trim: true,
  },

  alert_type: {
    type: String,
    enum: ["General", "Medical", "Fire", "Security", "Maintenance"],
    default: "General",
  },

  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "High",
  },

  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved", "Rejected"],
    default: "Pending",
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

  resolved_at: {
    type: Date,
  },
});

module.exports = mongoose.model("SosAlert", SosAlertSchema);
