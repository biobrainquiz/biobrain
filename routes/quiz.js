// CLEANED
const express = require("express");
const router = express.Router();

const requireLogin = require("../middleware/requireLogin");
const quizController = require("../controllers/quizController");

// Start Quiz
router.get(
  "/quiz/start/:examcode/:subjectcode/:unitcode/:topiccode",
  requireLogin,
  quizController.startQuiz
);

// Prepare Quiz (Analytics Page)
router.get(
  "/quiz/prepare/:examcode/:subjectcode",
  requireLogin,
  quizController.prepareQuiz
);

// Submit Quiz
router.post(
  "/quiz/submit",
  requireLogin,
  quizController.submitQuiz
);

// Create Order (Session-based Quiz Config)
router.post(
  "/quiz/createorder",
  requireLogin,
  quizController.createOrder
);
module.exports = router;

