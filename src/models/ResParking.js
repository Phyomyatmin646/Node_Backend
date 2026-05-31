const mongoose = require("mongoose");

const ResParkingSchema = new mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
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

module.exports = mongoose.model("ResParking", ResParkingSchema);
