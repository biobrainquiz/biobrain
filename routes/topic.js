const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const topicController = require("../controllers/topicController");

// GET /topics/:examcode/:subjectcode/:unitcode
router.get(
  "/:examcode/:subjectcode/:unitcode",
  requireLogin,
  topicController.getTopicsByExamAndSubjectAndUnit
);

module.exports = router;