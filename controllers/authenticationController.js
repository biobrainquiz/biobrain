// ==========================
// IMPORT DEPENDENCIES
// ==========================

// User model (MongoDB user collection)
const User = require("../models/User");

// Role model used to assign default roles during registration
const Role = require("../models/Role");

// Built-in Node.js module used for generating secure random tokens
const crypto = require("crypto");

// Library used to hash and compare passwords securely
const bcrypt = require("bcryptjs");

// Email service provider used to send password reset emails
const { Resend } = require("resend");

// Utility that detects device type (mobile / desktop) to render correct view
const getDevice = require("../utils/getDevice");

// Custom logger utility for structured error logging
const logger = require("../utils/logger");


// ==========================
// LOGIN
// ==========================

exports.login = async (req, res) => {
    try {

        // Extract identifier and password from request body
        // identifier can be email OR mobile OR username
        const { identifier, password } = req.body;

        // 1️⃣ Find user by email, mobile or username
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { mobile: identifier },
                { username: identifier }
            ]
        }).populate("roles"); // load role documents

        // If user not found return error
        if (!user) {
            return res.json({
                success: false,
                message: "User not found!"
            });
        }

        // 2️⃣ Compare entered password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password!"
            });
        }

        // 3️⃣ Create session after successful authentication
        req.session.user = user;

        // 4️⃣ Redirect user to original page if they were redirected to login
        const redirectUrl = req.session.redirectTo || "/";
        delete req.session.redirectTo;

        return res.json({
            success: true,
            redirect: redirectUrl
        });

    } catch (err) {

        // Log full error details for debugging
        logger.error({
            message: "Login Error",
            error: err.message,
            stack: err.stack
        });

        // Send generic error in production
        return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === "production"
                ? "Something went wrong"
                : err.message
        });
    }
};



// ==========================
// REGISTER (WITH ROLE)
// ==========================

exports.register = async (req, res) => {
    try {

        // Extract registration data
        const { username, password, confirmPassword, mobile, email } = req.body;

        // 1️⃣ Validate password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match!"
            });
        }

        // 2️⃣ Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username or Email already exists!"
            });
        }

        // 3️⃣ Fetch default role (student) from roles collection
        const defaultRole = await Role.findOne({ role: "student" });

        if (!defaultRole) {
            return res.status(500).json({
                success: false,
                message: "Default role not found. Please seed roles first."
            });
        }

        // 4️⃣ Create new user with default role
        const newUser = new User({
            username,
            password,
            mobile,
            email,
            roles: [defaultRole._id] // assign role reference
        });

        // Save user to database
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully!"
        });

    } catch (err) {

        // Log registration errors
        logger.error({
            message: "Register Error",
            error: err.message,
            stack: err.stack
        });

        return res.status(500).json({
            success: false,
            message: "Server error!"
        });
    }
};


// ==========================
// LOGOUT
// ==========================

exports.logout = (req, res) => {

    // Destroy session stored in server
    req.session.destroy(() => {

        // Clear session cookie in browser
        res.clearCookie("connect.sid");

        // Redirect user to homepage
        res.redirect("/");
    });
};



// ==========================
// FORGOT PASSWORD
// ==========================

exports.forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        // Check if user exists with provided email
        const user = await User.findOne({ email });

        // To prevent email enumeration, always return success message
        if (!user) {
            return res.json({
                success: true,
                message: "If this email exists, a reset link has been sent."
            });
        }

        // 1️⃣ Generate secure random reset token
        const token = crypto.randomBytes(32).toString("hex");

        // 2️⃣ Hash token before storing in database
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 3️⃣ Store hashed token and expiration time
        user.resetPasswordToken = hashedToken;

        const expiryMinutes = Number(process.env.EMAIL_EXPIRY_IN_MIN) || 10;

        user.resetPasswordExpires =
            Date.now() + expiryMinutes * 60 * 1000;

        await user.save();

        // 4️⃣ Create password reset URL
        const resetURL = `${process.env.BASE_URL}/reset/${token}`;

        // 5️⃣ Send reset email using Resend
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "BioBrain Password Reset",
            html: `...`
        });

        return res.json({
            success: true,
            message: "Reset link sent to email!"
        });

    } catch (err) {

        logger.error({
            message: "Forgot Password Error:",
            error: err.message,
            stack: err.stack
        });

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
// SHOW RESET PASSWORD PAGE
// ==========================

exports.showResetPage = (req, res) => {

    // Render device specific reset page (desktop/mobile)
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

        // 1️⃣ Validate password confirmation
        if (newPassword !== confirmPassword) {
            return res.json({
                success: false,
                message: "Passwords do not match!"
            });
        }

        // 2️⃣ Basic password strength validation
        if (newPassword.length < 6) {
            return res.json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        // 3️⃣ Hash received token before DB lookup
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 4️⃣ Find user with valid reset token and non-expired link
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

        // 5️⃣ Hash new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // 6️⃣ Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.json({
            success: true,
            message: "Password reset successful!"
        });

    } catch (err) {

        logger.error({
            message: "Reset Password Error:",
            error: err.message,
            stack: err.stack
        });

        return res.status(500).json({
            success: false,
            message: "Server error!"
        });
    }
};