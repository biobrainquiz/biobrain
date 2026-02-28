function requireLogin(req, res, next) {
  if (!req.session.user) {
    // Save requested URL
    req.session.redirectTo = req.originalUrl;
    return res.redirect("/login");
  }
  next();
}

module.exports = requireLogin;