const mongoose = require("mongoose");

const VisParkingSchema = new mongoose.Schema({
  slot_number: { type: String, required: true },
  status: { type: String, enum: ["Available", "Occupied", "Maintenance"], default: "Available" },
});

module.exports = mongoose.model("VisParking", VisParkingSchema);