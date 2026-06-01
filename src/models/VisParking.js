const mongoose = require("mongoose");

const VisParkingSchema = new mongoose.Schema(
  {
    totalSlot : number,
    availableSlot : number,
    maintenanceSlot : number,
  },
  { timestamps: true },
);

module.exports = mongoose.model("VisParking", VisParkingSchema);
