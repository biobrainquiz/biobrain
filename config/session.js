const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const configureSession = (app, mongoURI) => {
  const sessionExpiryMin = parseInt(process.env.SESSION_EXPIRY_IN_MIN) || 15;

  app.use(session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoURI }),
    cookie: { maxAge: sessionExpiryMin * 60 * 1000 }
  }));

  // Make session available in EJS
  app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
  });

  // Extend session
  app.use((req, res, next) => {
    if (req.session.user) req.session.touch();
    next();
  });

  // Disable cache
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
};

module.exports = configureSession;