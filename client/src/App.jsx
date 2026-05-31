import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api, { downloadUrl } from "./api";
import { currency, dateInput, gstRates, localTotals, states } from "./utils";

const emptyClient = {
  name: "",
  email: "",
  phone: "",
  gstin: "",
  address: "",
  city: "",
  state: "Kerala",
  notes: ""
};

const emptyInvoice = {
  invoiceNumber: "",
  client: "",
  issueDate: dateInput(new Date()),
  dueDate: dateInput(new Date(Date.now() + 15 * 86400000)),
  sellerState: "kerala",
  placeOfSupply: "kerala",
  status: "draft",
  notes: "",
  terms: "Payment due as per invoice due date.",
  items: [{ description: "", hsnSac: "", quantity: 1, rate: 0, gstRate: 18 }]
};

const statusColors = {
  draft: "#64748b",
  sent: "#2563eb",
  paid: "#059669",
  overdue: "#dc2626",
  cancelled: "#7c2d12"
};

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [clientSearch, setClientSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    const [clientRes, invoiceRes, analyticsRes] = await Promise.all([
      api.get("/clients"),
      api.get("/invoices"),
      api.get("/analytics/summary")
    ]);
    setClients(clientRes.data);
    setInvoices(invoiceRes.data);
    setAnalytics(analyticsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData().catch(() => {
      setLoading(false);
      setMessage("Connect MongoDB and start the API to load BillFlow data.");
    });
  }, []);

  const filteredClients = useMemo(() => {
    const term = clientSearch.toLowerCase();
    return clients.filter((client) =>
      [client.name, client.email, client.gstin, client.city].some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [clients, clientSearch]);

  const previewTotals = useMemo(
    () => localTotals(invoiceForm.items, invoiceForm.sellerState, invoiceForm.placeOfSupply),
    [invoiceForm]
  );

  async function saveClient(event) {
    event.preventDefault();
    await api.post("/clients", clientForm);
    setClientForm(emptyClient);
    setMessage("Client saved.");
    await loadData();
  }

  async function saveInvoice(event) {
    event.preventDefault();
    await api.post("/invoices", invoiceForm);
    setInvoiceForm({ ...emptyInvoice, invoiceNumber: `BF-${new Date().getFullYear()}-${String(invoices.length + 2).padStart(3, "0")}` });
    setMessage("Invoice created with GST totals.");
    await loadData();
  }

  async function markStatus(invoice, status) {
    await api.patch(`/invoices/${invoice._id}/status`, { status });
    await loadData();
  }

  function updateItem(index, field, value) {
    setInvoiceForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function addItem() {
    setInvoiceForm((current) => ({
      ...current,
      items: [...current.items, { description: "", hsnSac: "", quantity: 1, rate: 0, gstRate: 18 }]
    }));
  }

  function removeItem(index) {
    setInvoiceForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BF</div>
          <div>
            <strong>BillFlow</strong>
            <span>Smart GST Manager</span>
          </div>
        </div>
        <nav>
          {[
            ["dashboard", LayoutDashboard, "Dashboard"],
            ["invoices", FileText, "Invoices"],
            ["clients", Users, "Clients"],
            ["analytics", BarChart3, "Analytics"]
          ].map(([view, Icon, label]) => (
            <button key={view} className={activeView === view ? "active" : ""} onClick={() => setActiveView(view)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="export-box">
          <a href={downloadUrl("/export/invoices")}>
            <Download size={16} />
            Invoices CSV
          </a>
          <a href={downloadUrl("/export/clients")}>
            <Download size={16} />
            Clients CSV
          </a>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h1>
            <p>Invoices, GST.</p>
          </div>
          <button className="icon-button" onClick={loadData} title="Refresh">
            <RefreshCw size={18} />
          </button>
        </header>

        {message && <div className="notice">{message}</div>}
        {loading ? <div className="notice">Loading BillFlow data...</div> : null}

        {activeView === "dashboard" && <Dashboard analytics={analytics} invoices={invoices} />}
        {activeView === "clients" && (
          <ClientsView
            clients={filteredClients}
            clientForm={clientForm}
            setClientForm={setClientForm}
            saveClient={saveClient}
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
          />
        )}
        {activeView === "invoices" && (
          <InvoicesView
            clients={clients}
            invoices={invoices}
            invoiceForm={invoiceForm}
            setInvoiceForm={setInvoiceForm}
            previewTotals={previewTotals}
            saveInvoice={saveInvoice}
            updateItem={updateItem}
            addItem={addItem}
            removeItem={removeItem}
            markStatus={markStatus}
          />
        )}
        {activeView === "analytics" && <AnalyticsView analytics={analytics} />}
      </section>
    </main>
  );
}

function Dashboard({ analytics, invoices }) {
  const cards = analytics?.cards || {};
  return (
    <>
      <section className="metric-grid">
        <Metric title="Paid revenue" value={currency(cards.revenue)} icon={IndianRupee} />
        <Metric title="Outstanding" value={currency(cards.outstanding)} icon={Send} />
        <Metric title="GST liability" value={currency(cards.gstLiability)} icon={FileText} />
        <Metric title="Invoices" value={cards.invoiceCount || 0} icon={BarChart3} />
      </section>
      <section className="split">
        <Panel title="Recent invoices">
          <InvoiceTable invoices={invoices.slice(0, 6)} compact />
        </Panel>
        <Panel title="Monthly sales">
          <SalesChart data={analytics?.monthlySales || []} />
        </Panel>
      </section>
    </>
  );
}

function ClientsView({ clients, clientForm, setClientForm, saveClient, clientSearch, setClientSearch }) {
  return (
    <section className="split">
      <Panel title="Add client">
        <form className="form-grid" onSubmit={saveClient}>
          <Input label="Name" value={clientForm.name} onChange={(name) => setClientForm({ ...clientForm, name })} required />
          <Input label="Email" type="email" value={clientForm.email} onChange={(email) => setClientForm({ ...clientForm, email })} required />
          <Input label="Phone" value={clientForm.phone} onChange={(phone) => setClientForm({ ...clientForm, phone })} />
          <Input label="GSTIN" value={clientForm.gstin} onChange={(gstin) => setClientForm({ ...clientForm, gstin })} />
          <Input label="City" value={clientForm.city} onChange={(city) => setClientForm({ ...clientForm, city })} required />
          <Select label="State" value={clientForm.state} options={states} onChange={(state) => setClientForm({ ...clientForm, state })} />
          <label className="wide">
            Address
            <textarea value={clientForm.address} onChange={(event) => setClientForm({ ...clientForm, address: event.target.value })} required />
          </label>
          <button className="primary wide" type="submit">
            <Plus size={16} />
            Save client
          </button>
        </form>
      </Panel>
      <Panel title="Client directory">
        <div className="search">
          <Search size={17} />
          <input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Search clients" />
        </div>
        <div className="list">
          {clients.map((client) => (
            <article className="client-row" key={client._id}>
              <strong>{client.name}</strong>
              <span>{client.email}</span>
              <span>{client.city}, {client.state}</span>
              <small>{client.gstin || "Unregistered"}</small>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function InvoicesView(props) {
  const {
    clients,
    invoices,
    invoiceForm,
    setInvoiceForm,
    previewTotals,
    saveInvoice,
    updateItem,
    addItem,
    removeItem,
    markStatus
  } = props;

  return (
    <>
      <section className="invoice-layout">
        <Panel title="Create GST invoice">
          <form className="invoice-form" onSubmit={saveInvoice}>
            <div className="form-grid">
              <Input label="Invoice no." value={invoiceForm.invoiceNumber} onChange={(invoiceNumber) => setInvoiceForm({ ...invoiceForm, invoiceNumber })} required />
              <Select label="Client" value={invoiceForm.client} onChange={(client) => setInvoiceForm({ ...invoiceForm, client })} options={clients.map((client) => ({ label: client.name, value: client._id }))} required />
              <Input label="Issue date" type="date" value={invoiceForm.issueDate} onChange={(issueDate) => setInvoiceForm({ ...invoiceForm, issueDate })} required />
              <Input label="Due date" type="date" value={invoiceForm.dueDate} onChange={(dueDate) => setInvoiceForm({ ...invoiceForm, dueDate })} required />
              <Select label="Seller state" value={invoiceForm.sellerState} options={states} onChange={(sellerState) => setInvoiceForm({ ...invoiceForm, sellerState })} />
              <Select label="Supply state" value={invoiceForm.placeOfSupply} options={states} onChange={(placeOfSupply) => setInvoiceForm({ ...invoiceForm, placeOfSupply })} />
            </div>
            <div className="items-head">
              <strong>Line items</strong>
              <button type="button" onClick={addItem}>
                <Plus size={16} />
                Item
              </button>
            </div>
            {invoiceForm.items.map((item, index) => (
              <div className="item-grid" key={index}>
                <Input label="Description" value={item.description} onChange={(value) => updateItem(index, "description", value)} required />
                <Input label="HSN/SAC" value={item.hsnSac} onChange={(value) => updateItem(index, "hsnSac", value)} />
                <Input label="Qty" type="number" value={item.quantity} onChange={(value) => updateItem(index, "quantity", value)} required />
                <Input label="Rate" type="number" value={item.rate} onChange={(value) => updateItem(index, "rate", value)} required />
                <Select label="GST" value={item.gstRate} options={gstRates.map(String)} onChange={(value) => updateItem(index, "gstRate", Number(value))} />
                <button className="ghost" type="button" onClick={() => removeItem(index)} disabled={invoiceForm.items.length === 1}>Remove</button>
              </div>
            ))}
            <label>
              Notes
              <textarea value={invoiceForm.notes} onChange={(event) => setInvoiceForm({ ...invoiceForm, notes: event.target.value })} />
            </label>
            <button className="primary" type="submit">
              <FileText size={16} />
              Generate invoice
            </button>
          </form>
        </Panel>
        <Panel title="GST preview">
          <Totals totals={previewTotals} />
        </Panel>
      </section>
      <Panel title="Invoice register">
        <InvoiceTable invoices={invoices} markStatus={markStatus} />
      </Panel>
    </>
  );
}

function AnalyticsView({ analytics }) {
  return (
    <section className="split">
      <Panel title="Status split">
        <StatusChart data={analytics?.byStatus || []} />
      </Panel>
      <Panel title="Top clients">
        <div className="top-clients">
          {(analytics?.topClients || []).map((client) => (
            <div key={client.name}>
              <span>{client.name}</span>
              <strong>{currency(client.total)}</strong>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Monthly sales">
        <SalesChart data={analytics?.monthlySales || []} />
      </Panel>
    </section>
  );
}

function InvoiceTable({ invoices, compact, markStatus }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Client</th>
            <th>Status</th>
            <th>Total</th>
            {!compact && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.client?.name || "Client removed"}</td>
              <td><span className="status" style={{ background: statusColors[invoice.status] }}>{invoice.status}</span></td>
              <td>{currency(invoice.totals?.grandTotal)}</td>
              {!compact && (
                <td className="actions">
                  <a className="icon-button" href={downloadUrl(`/invoices/${invoice._id}/pdf`)} title="Download PDF">
                    <Download size={16} />
                  </a>
                  <button onClick={() => markStatus(invoice, "sent")}>Sent</button>
                  <button onClick={() => markStatus(invoice, "paid")}>Paid</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ title, value, icon: Icon }) {
  return (
    <article className="metric-card">
      <Icon size={20} />
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text", required }) {
  return (
    <label>
      {label}
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options, required }) {
  const normalized = options.map((option) => (typeof option === "string" ? { label: option, value: option } : option));
  return (
    <label>
      {label}
      <select value={value} required={required} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {normalized.map((option) => (
          <option value={option.value} key={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function Totals({ totals }) {
  return (
    <div className="totals">
      {Object.entries({
        Subtotal: totals.subTotal,
        CGST: totals.cgst,
        SGST: totals.sgst,
        IGST: totals.igst,
        "Total GST": totals.gstTotal,
        "Grand total": totals.grandTotal
      }).map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{currency(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function SalesChart({ data }) {
  return (
    <div className="chart">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
          <Tooltip formatter={(value) => currency(value)} />
          <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusChart({ data }) {
  return (
    <div className="chart">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={96} label>
            {data.map((entry) => <Cell key={entry.name} fill={statusColors[entry.name] || "#334155"} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;
