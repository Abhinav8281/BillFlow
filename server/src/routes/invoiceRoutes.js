const express = require("express");
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  downloadInvoicePdf
} = require("../controllers/invoiceController");

const router = express.Router();

router.route("/").get(getInvoices).post(createInvoice);
router.route("/:id").get(getInvoiceById).put(updateInvoice).delete(deleteInvoice);
router.patch("/:id/status", updateInvoiceStatus);
router.get("/:id/pdf", downloadInvoicePdf);

module.exports = router;
