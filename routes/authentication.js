const express = require("express");
const router = express.Router();
const authenticationController = require("../controllers/authenticationController");

// Login
router.post("/login", authenticationController.login);

// Logout
router.get("/logout", authenticationController.logout);

// Register
router.post("/register", authenticationController.register);

// Forgot Password
router.post("/forgot", authenticationController.forgotPassword);

// Show Reset Password Page
router.get("/showresetpage/:token", authenticationController.showResetPage);

// Reset Password
router.post("/reset/:token", authenticationController.resetPassword);

module.exports = router;