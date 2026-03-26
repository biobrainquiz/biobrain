const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const unitController = require("../controllers/unitController");

// GET /units/:examcode/:subjectcode
router.get(
  "/:examcode/:subjectcode",
  requireLogin,
  unitController.getUnitsByExamAndSubject
);

module.exports = router;