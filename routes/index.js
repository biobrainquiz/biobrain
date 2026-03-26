const express = require("express");
const router = express.Router();

const indexController = require("../controllers/indexController");

// ==============================
// HOME ROUTE
// ==============================
router.get("/", indexController.getHomePage);

module.exports = router;