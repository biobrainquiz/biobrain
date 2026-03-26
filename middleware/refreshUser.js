// middleware/refreshUser.js
const User = require("../models/User");

async function refreshUser(req, res, next) {
  try {
    if (!req.session.user?._id) return res.redirect("/authentication/login");

    // Fetch latest user data from DB
    const user = await User.findById(req.session.user._id).populate("roles");

    if (!user) return res.redirect("/authentication/login");

    // Attach fresh user to session
    req.session.user =user;
    next();
  } catch (err) {
    console.error("Error refreshing user:", err);
    res.status(500).send("Server Error");
  }
}

module.exports = refreshUser;