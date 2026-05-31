# BillFlow - Smart Invoice & GST Manager

BillFlow is a JavaScript-only MERN stack project for managing clients, GST-ready invoices, PDF downloads, CSV exports, and analytics.

## Features

- Client management with GSTIN, address, contact, and state details
- Invoice creation with CGST/SGST or IGST calculation
- Draft, sent, paid, overdue, and cancelled invoice states
- PDF invoice generation
- CSV export for invoices and clients
- Dashboard analytics for revenue, outstanding amount, GST liability, monthly sales, status split, and top clients
- Seed script with demo clients and invoices

## Run Locally

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

The API runs on `http://localhost:5000` and the React app runs on `http://localhost:5173`.

## API Routes

- `GET /api/health`
- `GET /api/clients`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `DELETE /api/clients/:id`
- `GET /api/invoices`
- `POST /api/invoices`
- `PUT /api/invoices/:id`
- `PATCH /api/invoices/:id/status`
- `DELETE /api/invoices/:id`
- `GET /api/invoices/:id/pdf`
- `GET /api/analytics/summary`
- `GET /api/export/invoices`
- `GET /api/export/clients`
