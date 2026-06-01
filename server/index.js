const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./src/config/db");
const clientRoutes = require("./src/routes/clientRoutes");
const invoiceRoutes = require("./src/routes/invoiceRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const exportRoutes = require("./src/routes/exportRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL  }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "BillFlow", timestamp: new Date().toISOString() });
});

app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);

const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`BillFlow API running on port ${port}`);
});
