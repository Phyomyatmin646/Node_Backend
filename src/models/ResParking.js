const mongoose = require("mongoose");

const ResParkingSchema = new mongoose.Schema(
  {
    totalSlot : number,
    availableSlot : number,
    maintenanceSlot : number,
  },
  { timestamps: true },
);

module.exports = mongoose.model("ResParking", ResParkingSchema);
