const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Login
router.post("/login", authController.login);

// Logout
router.get("/logout", authController.logout);

// Register
router.post("/register", authController.register);

// Forgot Password
router.post("/forgot", authController.forgotPassword);

module.exports = router;