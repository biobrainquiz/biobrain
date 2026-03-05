// CLEANED
const express = require("express");
const router = express.Router();

const requireLogin = require("../middleware/requireLogin");
const quizController = require("../controllers/quizController");

// Prepare Quiz 
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

// Create Quiz Order and Start Quiz
router.post(
  "/quiz/createorder",
  requireLogin,
  quizController.createOrder
);
module.exports = router;

