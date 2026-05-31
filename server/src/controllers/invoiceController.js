const Invoice = require("../models/Invoice");
const { calculateInvoiceTotals } = require("../utils/gstCalculator");
const { streamInvoicePdf } = require("../utils/pdfGenerator");

function normalizeInvoicePayload(payload) {
  return {
    ...payload,
    totals: calculateInvoiceTotals(payload.items || [], payload.sellerState, payload.placeOfSupply)
  };
}

async function getInvoices(req, res, next) {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.client) query.client = req.query.client;

    const invoices = await Invoice.find(query).populate("client").sort({ issueDate: -1 });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
}

async function getInvoiceById(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("client");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function createInvoice(req, res, next) {
  try {
    const invoice = await Invoice.create(normalizeInvoicePayload(req.body));
    const populated = await invoice.populate("client");
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function updateInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, normalizeInvoicePayload(req.body), {
      new: true,
      runValidators: true
    }).populate("client");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function updateInvoiceStatus(req, res, next) {
  try {
    const updates = { status: req.body.status };
    if (req.body.status === "paid") updates.paymentDate = new Date();
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate("client");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function deleteInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted" });
  } catch (error) {
    next(error);
  }
}

async function downloadInvoicePdf(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("client");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    streamInvoicePdf(invoice, res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  downloadInvoicePdf
};
