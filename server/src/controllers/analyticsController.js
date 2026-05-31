const Invoice = require("../models/Invoice");

async function getSummary(req, res, next) {
  try {
    const invoices = await Invoice.find().populate("client");
    const activeInvoices = invoices.filter((invoice) => invoice.status !== "cancelled");
    const paidInvoices = activeInvoices.filter((invoice) => invoice.status === "paid");
    const outstandingInvoices = activeInvoices.filter((invoice) => invoice.status !== "paid");

    const revenue = paidInvoices.reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0);
    const outstanding = outstandingInvoices.reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0);
    const gstLiability = activeInvoices.reduce((sum, invoice) => sum + invoice.totals.gstTotal, 0);

    const byStatus = activeInvoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});

    const monthlyMap = activeInvoices.reduce((acc, invoice) => {
      const key = new Date(invoice.issueDate).toLocaleString("en-IN", { month: "short", year: "numeric" });
      acc[key] = (acc[key] || 0) + invoice.totals.grandTotal;
      return acc;
    }, {});

    const clientMap = activeInvoices.reduce((acc, invoice) => {
      const name = invoice.client?.name || "Unknown";
      acc[name] = (acc[name] || 0) + invoice.totals.grandTotal;
      return acc;
    }, {});

    res.json({
      cards: {
        revenue,
        outstanding,
        gstLiability,
        invoiceCount: activeInvoices.length
      },
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      monthlySales: Object.entries(monthlyMap).map(([month, total]) => ({ month, total })),
      topClients: Object.entries(clientMap)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary };
