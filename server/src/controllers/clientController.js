const Client = require("../models/Client");

async function getClients(req, res, next) {
  try {
    const search = req.query.search || "";
    const query = search
      ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }, { gstin: new RegExp(search, "i") }] }
      : {};
    const clients = await Client.find(query).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const client = await Client.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json({ message: "Client deleted" });
  } catch (error) {
    next(error);
  }
}

module.exports = { getClients, createClient, updateClient, deleteClient };
