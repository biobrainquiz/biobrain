const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const refreshUser = require("../middleware/refreshUser");
const mocktestController = require("../controllers/mocktestController");
const resultController = require("../controllers/resultController");

// initalize mocktest 
router.get(
  "/init/:examcode/:subjectcode",
  requireLogin,
  mocktestController.init
);

// Create mocktest Order and Start mocktest
router.post(
  "/createorder",
  requireLogin,
  mocktestController.createOrder
);

// Submit mocktest
router.post(
  "/submit",
  requireLogin,
  refreshUser,
  mocktestController.submit
);

// Download result PDF
router.get(
  "/result/pdf/:mocktestid",
  resultController.downloadResultPdf);

module.exports = router;
