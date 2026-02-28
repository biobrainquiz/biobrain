const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.get("/reset/:token", (req, res) => {
  const device = req.useragent.isMobile
    ? "mobile"
    : req.useragent.isTablet
      ? "tablet"
      : "desktop";

  res.render(`pages/${device}/reset`, {
    token: req.params.token
  });
});

router.post("/reset/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Hash token before searching
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid or expired token!"
      });
    }

    // Update password (pre("save") will hash it)
    user.password = newPassword;

    // Remove reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful!"
    });

  } catch (err) {
    res.json({
      success: false,
      message: "Server error!"
    });
  }
});

module.exports = router;