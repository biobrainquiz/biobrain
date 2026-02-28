const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const { Resend } = require("resend");

router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    // 1️⃣ Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // 2️⃣ Hash token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 3️⃣ Save hashed token + expiry
    user.resetPasswordToken = hashedToken;

    // Convert minutes (string) → number → milliseconds
    const expiryMinutes = Number(process.env.EMAIL_EXPIRY_IN_MIN) || 10;
    user.resetPasswordExpires =
      Date.now() + expiryMinutes * 60 * 1000;

    await user.save();

    console.log("Resend API Key exists:", !!process.env.RESEND_API_KEY);
    console.log("Resend API :", process.env.RESEND_API_KEY);
    console.log("Email From:", process.env.EMAIL_FROM);

    const resetURL = `${process.env.BASE_URL}/reset/${token}`;

    // Send Email using Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "BioBrain Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px;">
          <h2 style="color:#1B5E20;">BioBrain Password Reset</h2>
          <p>Hello ${user.username},</p>
          <p>You requested to reset your password.</p>
          <p>This link will expire in ${expiryMinutes} minutes.</p>

          <div style="text-align:center; margin:30px 0;">
            <a href="${resetURL}"
               style="background-color:#1B5E20; color:white;
                      padding:12px 20px; text-decoration:none;
                      border-radius:5px;">
              Reset Password
            </a>
          </div>

          <p>If you did not request this, please ignore this email.</p>
          <hr/>
          <small>© ${new Date().getFullYear()} BioBrain</small>
        </div>
      `,
    });

    res.json({ success: true, message: "Reset link sent to email!" });

  } catch (err) {
    res.json({ success: false, message: "Server error!" + err.message });
  }
});
module.exports = router;