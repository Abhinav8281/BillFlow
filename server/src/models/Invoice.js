const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    hsnSac: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    rate: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, required: true, enum: [0, 5, 12, 18, 28] }
  },
  { _id: false }
);

const totalsSchema = new mongoose.Schema(
  {
    subTotal: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    placeOfSupply: { type: String, required: true, trim: true },
    sellerState: { type: String, required: true, trim: true },
    items: { type: [itemSchema], validate: (items) => items.length > 0 },
    totals: { type: totalsSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft"
    },
    paymentDate: { type: Date },
    notes: { type: String, trim: true },
    terms: { type: String, trim: true, default: "Payment due as per invoice due date." }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
