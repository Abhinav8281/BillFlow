const express = require("express");
const { getSummary } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/summary", getSummary);

module.exports = router;
