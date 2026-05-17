const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  phone: { type: String, required: true },
  nric_number: { type: String, required: true },
  nric_photo_url: { type: String },
  target_room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  reason_for_visit: { type: String },
  check_in_time: { type: Date, default: Date.now },
  check_out_time: { type: Date },
  parking_slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "VisCarParking" },
}); 

module.exports = mongoose.model("Visitor", VisitorSchema);