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

// Utility that detects device type (mobile / desktop) to render correct view
const getDevice = require("../utils/getDevice");

// Custom logger utility for structured error logging
const logger = require("../utils/logger");


const authenticationEmailService = require("../services/authenticationEmailService");


// ==========================
// LOGIN (WITH EMAIL VERIFICATION CHECK)
// ==========================

exports.login = async (req, res) => {
    try {
        // Extract identifier and password from request body
        const { identifier, password } = req.body;

        // 1️⃣ Find user by email, mobile or username
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { mobile: identifier },
                { username: identifier }
            ]
        }).populate("roles");

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

        // 3️⃣ NEW: Email Verification Check
        const isVerificationEnabled = process.env.ENABLE_EMAIL_VERIFICATION === "true";

        if (isVerificationEnabled && !user.isVerified) {
            return res.json({
                success: false,
                message: "Please verify your email address before logging in.",
                email: user.email // <--- CRITICAL: Send this so frontend knows who to resend to
            });
        }

        // 4️⃣ Check if account is active (using your existing isActive field)
        if (!user.isActive) {
            return res.json({
                success: false,
                message: "Your account has been deactivated. Please contact support."
            });
        }

        // 5️⃣ Create session after successful authentication
        req.session.user = user;

        // 6️⃣ Handle Redirection
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

        return res.status(500).json({
            success: false,
            message: "An error occurred during login."
        });
    }
};

// ==========================
// REGISTER (WITH TOGGLEABLE EMAIL VERIFICATION ,WITH ROLE)
// ==========================

exports.register = async (req, res) => {
    try {

        // 1️⃣ Extract registration data
        const { username, password, confirmPassword, mobile, email } = req.body;

        // 2️⃣ Validate password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match!"
            });
        }

        // 3️⃣ Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username or Email already exists!"
            });
        }

        // 4️⃣ Fetch default role (student)
        const defaultRole = await Role.findOne({ role: "student" });
        if (!defaultRole) {
            return res.status(500).json({
                success: false,
                message: "Default role not found. Please seed roles first."
            });
        }

        // 5️⃣ Check Verification Toggle from .env
        const isVerificationEnabled = process.env.ENABLE_EMAIL_VERIFICATION === "true";

        // 6️⃣ Prepare User Data
        const userData = {
            username,
            password,
            mobile,
            email,
            roles: [defaultRole._id],
            isVerified: !isVerificationEnabled // If verification is OFF, set to true immediately
        };

        let rawVerificationToken = null;

        // 7️⃣ Generate Tokens ONLY if verification is enabled
        if (isVerificationEnabled) {
            rawVerificationToken = crypto.randomBytes(32).toString("hex");

            const hashedToken = crypto
                .createHash("sha256")
                .update(rawVerificationToken)
                .digest("hex");

            userData.emailVerificationToken = hashedToken;
            userData.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        }

        // 8️⃣ Save user to database
        const newUser = new User(userData);
        await newUser.save();

        // 9️⃣ Send Email ONLY if verification is enabled
        if (isVerificationEnabled && rawVerificationToken) {
            const verificationURL = `${process.env.BASE_URI}/authentication/verify-email/${rawVerificationToken}`;

            try {
                await authenticationEmailService.sendVerificationEmail(newUser, verificationURL);
            } catch (emailError) {
                // Log the error but don't crash the registration
                logger.error({
                    message: "Verification Email Send Failure",
                    error: emailError.message,
                    userId: newUser._id
                });
            }

            return res.status(201).json({
                success: true,
                message: "Registration successful! Please check your email to verify your account."
            });
        }

        // 🔟 Standard response if verification is disabled
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
// VERIFY EMAIL
// ==========================

exports.verifyEmail = async (req, res) => {
    try {
        // 1️⃣ Check if verification is even enabled in .env
        const isVerificationEnabled = process.env.ENABLE_EMAIL_VERIFICATION === "true";

        if (!isVerificationEnabled) {
            // If disabled, just redirect to login as no verification is required
            return res.redirect("/authentication/login?message=verification_not_required");
        }

        const { token } = req.params;

        // 2️⃣ Hash the incoming token to match the stored version in DB
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 3️⃣ Find user with valid token and ensure it hasn't expired
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() } // Token must be in the future
        });

        // 4️⃣ Handle invalid or expired tokens
        if (!user) {
            // 1. Try to find the user by the token anyway (even if expired) 
            // to get their email for the redirect.
            const expiredUser = await User.findOne({ emailVerificationToken: hashedToken });

            let redirectUrl = "/authentication/resend-link-page?error=expired";

          
            if (expiredUser) {
                // Encode the email to handle special characters like '+' or '.'
                const emailValue = encodeURIComponent(expiredUser.email);
                redirectUrl += `&email=${emailValue}`;
            }

            return res.redirect(redirectUrl);
        }

        // 5️⃣ Update User status
        user.isVerified = true;

        // 6️⃣ Clear the token fields so they cannot be reused
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        // 7️⃣ Success Response
        // Redirect to login with a 'verified' flag so your UI can show a success toast
        //return res.redirect("/authentication/login?verified=true");
        // Inside your verify-email route handler
        
        // 7️⃣ Success Response
        return res.render('authentication/verify-success');

    } catch (err) {
        // Log verification errors
        logger.error({
            message: "Email Verification Error",
            error: err.message,
            stack: err.stack
        });

        return res.status(500).json({
            success: false,
            message: "An internal server error occurred during verification."
        });
    }
};

// ==========================
// RESEND VERIFICATION EMAIL
// ==========================

exports.resendVerification = async (req, res) => {
    try {
        // 1️⃣ Check if verification is enabled
        const isVerificationEnabled = process.env.ENABLE_EMAIL_VERIFICATION === "true";
        if (!isVerificationEnabled) {
            return res.json({
                success: false,
                message: "Email verification is currently disabled."
            });
        }

        const { email } = req.body;

        // 2️⃣ Find user (only if they are NOT verified yet)
        const user = await User.findOne({ email });

        if (!user) {
            // 🔒 Security: Use generic message to prevent email enumeration
            return res.json({
                success: true,
                message: "If an account exists with this email, a new verification link has been sent."
            });
        }

        if (user.isVerified) {
            return res.json({
                success: false,
                message: "This account is already verified. Please log in."
            });
        }

        // 3️⃣ Generate New Token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        // 4️⃣ Update User with new token and expiry
        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        // 5️⃣ Send Email
        const verificationURL = `${process.env.BASE_URI}/authentication/verify-email/${rawToken}`;

        try {
            await authenticationEmailService.sendVerificationEmail(user, verificationURL);
        } catch (emailError) {
            logger.error("Resend Email failed:", emailError.message);
            return res.status(500).json({
                success: false,
                message: "Error sending email. Please try again later."
            });
        }

        return res.json({
            success: true,
            message: "A new verification link has been sent to your email."
        });

    } catch (err) {
        logger.error({ message: "Resend Verification Error", error: err.message });
        return res.status(500).json({ success: false, message: "Server error!" });
    }
};

exports.showCheckEmailPage = (req, res) => {
    // We pass the email via query string: /authentication/check-email?email=user@example.com
    const { email } = req.query;

    res.render(`pages/${getDevice(req)}/check-email`, {
        email: email || "your email",
        isVerificationEnabled: process.env.ENABLE_EMAIL_VERIFICATION === "true"
    });
};

exports.showResendPage = (req, res) => {
    res.render(`pages/${getDevice(req)}/resend-link-page`, {
        isVerificationEnabled: process.env.ENABLE_EMAIL_VERIFICATION === "true"
    });
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

        const user = await User.findOne({ email });

        // 🔒 Prevent email enumeration
        if (!user) {
            return res.json({
                success: true,
                message: "If this email exists, a reset link has been sent."
            });
        }

        // 1️⃣ Generate token
        const token = crypto.randomBytes(32).toString("hex");

        // 2️⃣ Hash token
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 3️⃣ Save token + expiry
        const expiryMinutes = Number(process.env.RESET_PASSWORD_EXPIRY_IN_MIN) || 15;

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires =
            Date.now() + expiryMinutes * 60 * 1000;

        await user.save();

        // 4️⃣ Create reset URL
        const resetURL = `${process.env.BASE_URI}/authentication/showresetpage/${token}`;

        // 5️⃣ Send email (safe handling)
        try {
            await authenticationEmailService.sendForgotPasswordEmail(user, resetURL);
        } catch (emailError) {
            // ❗ Do NOT expose error to user
            logger.error("Email failed:", emailError.message);
        }

        // ✅ Always return success (security)
        return res.json({
            success: true,
            message: "If this email exists, a reset link has been sent."
        });

    } catch (err) {

        logger.error({
            message: "Forgot Password Error:",
            error: err.message,
            stack: err.stack
        });

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
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

        // 6️⃣ Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.password = newPassword;

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