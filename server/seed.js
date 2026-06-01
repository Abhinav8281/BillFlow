const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Client = require("./src/models/Client");
const Invoice = require("./src/models/Invoice");
const { calculateInvoiceTotals } = require("./src/utils/gstCalculator");

dotenv.config();

const clients = [
  {
    name: "Apex Retail India",
    email: "accounts@apexretail.in",
    phone: "+91 98765 43210",
    gstin: "27AARCA1234L1Z9",
    address: "12 Phoenix Market Road",
    city: "Mumbai",
    state: "Maharashtra"
  },
  {
    name: "Northstar Logistics",
    email: "finance@northstarlogistics.in",
    phone: "+91 99887 76655",
    gstin: "29AAFCN9876P1Z2",
    address: "88 Industrial Layout",
    city: "Bengaluru",
    state: "Karnataka"
  },
  {
    name: "Greenline Foods",
    email: "billing@greenlinefoods.in",
    phone: "+91 90909 12345",
    gstin: "24AAGCG4567Q1Z4",
    address: "4 Riverfront Avenue",
    city: "Ahmedabad",
    state: "Gujarat"
  }
];

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed() {
  const uri = process.env.MONGO_URI || "mongodb+srv://root:1234@cluster1.vxrjkx1.mongodb.net/billflow";
  await mongoose.connect(uri);
  await Client.deleteMany();
  await Invoice.deleteMany();

  const createdClients = await Client.insertMany(clients);
  const invoices = [
    {
      invoiceNumber: "BF-2026-001",
      client: createdClients[0]._id,
      issueDate: daysFromNow(-18),
      dueDate: daysFromNow(12),
      sellerState: "Maharashtra",
      placeOfSupply: "Maharashtra",
      status: "paid",
      items: [
        { description: "POS billing automation", hsnSac: "998314", quantity: 1, rate: 76000, gstRate: 18 },
        { description: "Training and onboarding", hsnSac: "998313", quantity: 2, rate: 6500, gstRate: 18 }
      ]
    },
    {
      invoiceNumber: "BF-2026-002",
      client: createdClients[1]._id,
      issueDate: daysFromNow(-10),
      dueDate: daysFromNow(20),
      sellerState: "kerala",
      placeOfSupply: "Karnataka",
      status: "sent",
      items: [
        { description: "Fleet invoice integration", hsnSac: "998314", quantity: 1, rate: 125000, gstRate: 18 }
      ]
    },
    {
      invoiceNumber: "BF-2026-003",
      client: createdClients[2]._id,
      issueDate: daysFromNow(-35),
      dueDate: daysFromNow(-5),
      sellerState: "kerala",
      placeOfSupply: "Gujarat",
      status: "overdue",
      items: [
        { description: "Inventory GST reconciliation", hsnSac: "998313", quantity: 1, rate: 54000, gstRate: 18 },
        { description: "Monthly support", hsnSac: "998313", quantity: 3, rate: 9000, gstRate: 18 }
      ]
    }
  ].map((invoice) => ({
    ...invoice,
    totals: calculateInvoiceTotals(invoice.items, invoice.sellerState, invoice.placeOfSupply)
  }));

  await Invoice.insertMany(invoices);
  console.log("BillFlow demo data seeded");
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
