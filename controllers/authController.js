const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Resend } = require("resend");
const getDevice = require("../utils/getDevice");

// ==========================
// LOGIN
// ==========================
exports.login = async (req, res) => {
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

        // 3️⃣ Create session
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role || "user"
        };

        // 4️⃣ Redirect support
        const redirectUrl = req.session.redirectTo || "/";
        delete req.session.redirectTo;

        return res.json({
            success: true,
            redirect: redirectUrl
        });

    } catch (err) {
        console.error("Login Error:", err);

        return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === "production"
                ? "Something went wrong"
                : err.message
        });
    }
};

// ==========================
// LOGOUT
// ==========================
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
};

// ==========================
// REGISTER
// ==========================
exports.register = async (req, res) => {
    try {
        const { username, password, confirmPassword, mobile, email } = req.body;

        // 1️⃣ Password match check
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match!"
            });
        }

        // 2️⃣ Check if username/email exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username or Email already exists!"
            });
        }

        // 3️⃣ Hash password (IMPORTANT)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4️⃣ Create user
        const newUser = new User({
            username,
            password: hashedPassword,
            mobile,
            email
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully!"
        });

    } catch (err) {
        console.error("Register Error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error!"
        });
    }
};

// ==========================
// FORGOT PASSWORD
// ==========================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                success: true,
                message: "If this email exists, a reset link has been sent."
            });
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

        const expiryMinutes = Number(process.env.EMAIL_EXPIRY_IN_MIN) || 10;
        user.resetPasswordExpires =
            Date.now() + expiryMinutes * 60 * 1000;

        await user.save();

        // 4️⃣ Create reset URL
        const resetURL = `${process.env.BASE_URL}/reset/${token}`;

        // 5️⃣ Send Email
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
      `
        });

        return res.json({
            success: true,
            message: "Reset link sent to email!"
        });

    } catch (err) {
        console.error("Forgot Password Error:", err);

        return res.status(500).json({
            success: false,
            message:
                process.env.NODE_ENV === "production"
                    ? "Something went wrong"
                    : err.message
        });
    }
};




// ==========================
// SHOW RESET PAGE
// ==========================
exports.showResetPage = (req, res) => {
    res.render(`pages/${getDevice(req)}/reset`, {
        token: req.params.token
    });
};

// ==========================
// RESET PASSWORD
// ==========================
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword, confirmPassword } = req.body;

        // 1️⃣ Check passwords match
        if (newPassword !== confirmPassword) {
            return res.json({
                success: false,
                message: "Passwords do not match!"
            });
        }

        // 2️⃣ Optional: basic strength check
        if (newPassword.length < 6) {
            return res.json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        // 3️⃣ Hash token before searching
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 4️⃣ Find valid user
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

        // 5️⃣ Hash new password (if no pre-save hook)
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // 6️⃣ Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.json({
            success: true,
            message: "Password reset successful!"
        });

    } catch (err) {
        console.error("Reset Password Error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error!"
        });
    }
};