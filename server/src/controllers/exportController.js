const { Parser } = require("json2csv");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");

function sendCsv(res, filename, rows, fields) {
  const parser = new Parser({ fields });
  const csv = parser.parse(rows);
  res.header("Content-Type", "text/csv");
  res.attachment(filename);
  res.send(csv);
}

async function exportInvoices(req, res, next) {
  try {
    const invoices = await Invoice.find().populate("client").sort({ issueDate: -1 });
    const rows = invoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.client?.name,
      issueDate: invoice.issueDate.toISOString().slice(0, 10),
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      status: invoice.status,
      subTotal: invoice.totals.subTotal,
      cgst: invoice.totals.cgst,
      sgst: invoice.totals.sgst,
      igst: invoice.totals.igst,
      gstTotal: invoice.totals.gstTotal,
      grandTotal: invoice.totals.grandTotal
    }));
    sendCsv(res, "billflow-invoices.csv", rows, Object.keys(rows[0] || {}));
  } catch (error) {
    next(error);
  }
}

async function exportClients(req, res, next) {
  try {
    const clients = await Client.find().sort({ name: 1 });
    const rows = clients.map((client) => ({
      name: client.name,
      email: client.email,
      phone: client.phone,
      gstin: client.gstin,
      city: client.city,
      state: client.state,
      address: client.address
    }));
    sendCsv(res, "billflow-clients.csv", rows, Object.keys(rows[0] || {}));
  } catch (error) {
    next(error);
  }
}

module.exports = { exportInvoices, exportClients };
