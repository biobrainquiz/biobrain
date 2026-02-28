const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");


// 🔐 LOGIN ROUTE
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

    // 3️⃣ CREATE SESSION
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role || "user"  // ready for admin feature
    };

    // 4️⃣ Redirect logic support
    const redirectUrl = req.session.redirectTo || "/";
    delete req.session.redirectTo;

    res.json({
      success: true,
      redirect: redirectUrl
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
});


// 🔓 LOGOUT ROUTE (outside login)
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

module.exports = router;