export const states = [
  "Andhra Pradesh",
  "Kerala",
  "Delhi",
  "Gujarat",
  "Karnataka",
  "Maharashtra",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal"
];

export const gstRates = [0, 5, 12, 18, 28];

export function currency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });
}

export function dateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function localTotals(items, sellerState, placeOfSupply) {
  const sameState = sellerState === placeOfSupply;
  return items.reduce(
    (acc, item) => {
      const taxable = Number(item.quantity || 0) * Number(item.rate || 0);
      const gst = taxable * (Number(item.gstRate || 0) / 100);
      acc.subTotal += taxable;
      acc.gstTotal += gst;
      if (sameState) {
        acc.cgst += gst / 2;
        acc.sgst += gst / 2;
      } else {
        acc.igst += gst;
      }
      acc.grandTotal = acc.subTotal + acc.gstTotal;
      return acc;
    },
    { subTotal: 0, cgst: 0, sgst: 0, igst: 0, gstTotal: 0, grandTotal: 0 }
  );
}
