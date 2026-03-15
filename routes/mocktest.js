const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const mocktestController = require("../controllers/mocktestController");

// initalize Quiz 
router.get(
  "/mocktest/init/:examcode/:subjectcode",
  requireLogin,
  mocktestController.init
);

module.exports = router;