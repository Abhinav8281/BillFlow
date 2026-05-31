function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateInvoiceTotals(items, sellerState, placeOfSupply) {
  const sameState = String(sellerState).trim().toLowerCase() === String(placeOfSupply).trim().toLowerCase();

  const totals = items.reduce(
    (acc, item) => {
      const taxable = Number(item.quantity) * Number(item.rate);
      const gst = taxable * (Number(item.gstRate) / 100);

      acc.subTotal += taxable;
      acc.gstTotal += gst;

      if (sameState) {
        acc.cgst += gst / 2;
        acc.sgst += gst / 2;
      } else {
        acc.igst += gst;
      }

      return acc;
    },
    { subTotal: 0, cgst: 0, sgst: 0, igst: 0, gstTotal: 0, grandTotal: 0 }
  );

  totals.grandTotal = totals.subTotal + totals.gstTotal;

  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, roundMoney(value)]));
}

module.exports = { calculateInvoiceTotals, roundMoney };
