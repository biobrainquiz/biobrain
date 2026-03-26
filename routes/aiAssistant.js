const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const aiAssistanceController = require("../controllers/aiAssistanceController");


// Download PDF
router.post(
    "/explainanswer",
    requireLogin,
    aiAssistanceController.aiExplainAnswer);

router.post(
    "/singlequizsummary",
    requireLogin,
    aiAssistanceController.aiSingleQuizSummary);

router.post(
    "/allquizsummary",
    requireLogin,
    aiAssistanceController.aiAllQuizSummary);

module.exports = router;