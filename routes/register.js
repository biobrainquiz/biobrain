const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Registration API
router.post("/register", async (req, res) => {
  const { username, password, confirmPassword, mobile, email } = req.body;

  // 1️⃣ Password match check
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: "Passwords do not match!" });
  }

  try {
    // 2️⃣ Check if username/email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username or Email already exists!" });
    }

    // 3️⃣ Create new user
    const newUser = new User({ username, password, mobile, email });
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

module.exports = router;