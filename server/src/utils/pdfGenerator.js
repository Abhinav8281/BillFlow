const PDFDocument = require("pdfkit");

function money(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function drawRow(doc, y, columns, bold = false) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
  columns.forEach((column) => {
    doc.text(column.text, column.x, y, { width: column.width, align: column.align || "left" });
  });
}

function streamInvoicePdf(invoice, res) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const company = {
    name: process.env.COMPANY_NAME || "BillFlow Demo Pvt Ltd",
    gstin: process.env.COMPANY_GSTIN || "27ABCDE1234F1Z5",
    address: process.env.COMPANY_ADDRESS || "Mumbai, Maharashtra"
  };

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${invoice.invoiceNumber}.pdf`);
  doc.pipe(res);

  doc.font("Helvetica-Bold").fontSize(24).text("Tax Invoice", 48, 48);
  doc.fontSize(11).text(company.name, 48, 88);
  doc.font("Helvetica").text(company.address).text(`GSTIN: ${company.gstin}`);

  doc.font("Helvetica-Bold").fontSize(10).text("Invoice Details", 360, 54);
  doc.font("Helvetica").text(`No: ${invoice.invoiceNumber}`, 360, 72);
  doc.text(`Issue: ${new Date(invoice.issueDate).toLocaleDateString("en-IN")}`, 360, 88);
  doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString("en-IN")}`, 360, 104);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 360, 120);

  doc.moveTo(48, 150).lineTo(545, 150).strokeColor("#d6d9de").stroke();

  doc.font("Helvetica-Bold").fontSize(10).text("Bill To", 48, 170);
  doc.font("Helvetica").fontSize(10);
  doc.text(invoice.client.name, 48, 188);
  doc.text(invoice.client.address, 48, 204, { width: 230 });
  doc.text(`${invoice.client.city}, ${invoice.client.state}`, 48, 236);
  doc.text(`GSTIN: ${invoice.client.gstin || "Unregistered"}`, 48, 252);

  doc.font("Helvetica-Bold").text("GST Treatment", 360, 170);
  doc.font("Helvetica").text(`Seller State: ${invoice.sellerState}`, 360, 188);
  doc.text(`Place of Supply: ${invoice.placeOfSupply}`, 360, 204);

  const tableTop = 292;
  doc.rect(48, tableTop - 10, 497, 24).fill("#f0f3f7").fillColor("#111827");
  drawRow(doc, tableTop - 3, [
    { text: "Description", x: 56, width: 170 },
    { text: "HSN/SAC", x: 232, width: 60 },
    { text: "Qty", x: 300, width: 42, align: "right" },
    { text: "Rate", x: 348, width: 70, align: "right" },
    { text: "GST", x: 424, width: 44, align: "right" },
    { text: "Amount", x: 474, width: 64, align: "right" }
  ], true);

  let y = tableTop + 25;
  invoice.items.forEach((item) => {
    const amount = Number(item.quantity) * Number(item.rate);
    drawRow(doc, y, [
      { text: item.description, x: 56, width: 170 },
      { text: item.hsnSac || "-", x: 232, width: 60 },
      { text: item.quantity.toString(), x: 300, width: 42, align: "right" },
      { text: money(item.rate), x: 348, width: 70, align: "right" },
      { text: `${item.gstRate}%`, x: 424, width: 44, align: "right" },
      { text: money(amount), x: 474, width: 64, align: "right" }
    ]);
    y += 26;
  });

  y += 18;
  const totals = [
    ["Subtotal", invoice.totals.subTotal],
    ["CGST", invoice.totals.cgst],
    ["SGST", invoice.totals.sgst],
    ["IGST", invoice.totals.igst],
    ["Total GST", invoice.totals.gstTotal],
    ["Grand Total", invoice.totals.grandTotal]
  ];

  totals.forEach(([label, value], index) => {
    const bold = index === totals.length - 1;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10);
    doc.text(label, 360, y, { width: 90 });
    doc.text(money(value), 450, y, { width: 90, align: "right" });
    y += bold ? 26 : 20;
  });

  doc.font("Helvetica-Bold").fontSize(10).text("Notes", 48, y + 12);
  doc.font("Helvetica").text(invoice.notes || "Thank you for your business.", 48, y + 30, { width: 300 });
  doc.text(invoice.terms || "", 48, y + 56, { width: 300 });

  doc.end();
}

module.exports = { streamInvoicePdf };
