const mongoose = require("mongoose");

const VisParkingSchema = new mongoose.Schema(
  {
    slot_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Maintenance"],
      default: "Available",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("VisParking", VisParkingSchema);
