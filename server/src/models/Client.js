const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
