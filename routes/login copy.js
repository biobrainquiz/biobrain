const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 1️⃣ Find user by email OR mobile
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { mobile: identifier }
      ]
    });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found!"
      });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid password!"
      });
    }


    // 🔐 STEP 4 — CREATE SESSION HERE
    req.session.user = {
      id: user._id,
      username: user.username,
    };

    // 3️⃣ Success
    res.json({
      success: true,
      message: "Login successful!"
    });

  } catch (err) {
    console.error("Login Error:", err);

    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message
    });
  }

  // 🔓 LOGOUT ROUTE (Step 5)
  router.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });

});

module.exports = router;