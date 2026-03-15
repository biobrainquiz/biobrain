const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const mocktestController = require("../controllers/mocktestController");
const resultController = require("../controllers/resultController");

// initalize mocktest 
router.get(
  "/mocktest/init/:examcode/:subjectcode",
  requireLogin,
  mocktestController.init
);

// Create mocktest Order and Start mocktest
router.post(
  "/mocktest/createorder",
  requireLogin,
  mocktestController.createOrder
);

// Submit mocktest
router.post(
  "/mocktest/submit",
  requireLogin,
  mocktestController.submit
);

// Download PDF
router.get(
  "/mocktest/result/pdf/:mocktestid",
  resultController.downloadResultPdf);

module.exports = router;