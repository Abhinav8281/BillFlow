const express = require("express");
const { exportInvoices, exportClients } = require("../controllers/exportController");

const router = express.Router();

router.get("/invoices", exportInvoices);
router.get("/clients", exportClients);

module.exports = router;
