/* =========================================
   ENVIRONMENT VARIABLES 🟥
   🟥 RED = Critical: Must stay first; changing order breaks usage of process.env
========================================= */
require("dotenv").config();


/* =========================================
   CORE MODULES 🟩
   🟩 GREEN = Flexible: Can reorder safely
========================================= */
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");


/* =========================================
   SESSION & AUTH MODULES 🟨
   🟨 YELLOW = Some dependencies: usually safe, but order matters for session/middleware usage
========================================= */
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const useragent = require("express-useragent");


/* =========================================
   UTILITIES 🟩
   🟩 GREEN = Flexible: Can reorder safely
========================================= */
const escapeHtml = require("./utils/escapeHtml");
const getDevice = require("./utils/getDevice"); // uses useragent
const mapCodesToNames = require("./utils/mapCodesToNames");
const autoSeed = require("./utils/autoSeeder"); // depends on DB connection
const logger = require("./utils/logger");


/* =========================================
   MIDDLEWARE 🟨
   🟨 YELLOW = Some dependencies: order matters for routes that use middleware
========================================= */
const errorHandler = require("./middleware/errorHandler"); // must be last
const requireLogin = require("./middleware/requireLogin"); // before protected routes


/* =========================================
   CONFIGURATION 🟩
   🟩 GREEN = Flexible: Can reorder safely
========================================= */
const connectDB = require("./config/db");


/* =========================================
   DATABASE MODELS 🟨
   🟨 YELLOW = Must import after mongoose
========================================= */
const Question = require("./models/Question");
const Unit = require("./models/Unit");
const Topic = require("./models/Topic");
const Exam = require("./models/Exam");


/* =========================================
   EXPRESS APPLICATION INITIALIZATION 🟩
   🟩 GREEN = Flexible: Can initialize app here
========================================= */
const app = express();


/* =========================================
   DATABASE CONNECTION 🟥
   🟥 RED = Critical: Must connect before using DB (autoSeed, models)
========================================= */

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(async () => {
    logger.info("✅ Connected to MongoDB");
    const requestFromDashboard = false;
    await autoSeed(requestFromDashboard, "factory");
  })
  .catch(err => {
    logger.error({
      message: "❌ MongoDB connection error",
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  });


/* =========================================
   GLOBAL MIDDLEWARE 🟥
   🟥 RED = Critical: Must be before routes
========================================= */
// Request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} ${req.ip}`);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Device detection
app.use(useragent.express());


/* =========================================
   VIEW ENGINE CONFIGURATION 🟨
   🟨 YELLOW = Usually safe, must be before res.render()
========================================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


/* =========================================
   SESSION CONFIGURATION 🟥
   🟥 RED = Critical: Must be before routes that access req.session
========================================= */
const sessionExpiryMin = parseInt(process.env.SESSION_EXPIRY_IN_MIN) || 15;

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: mongoURI }),
    cookie: { maxAge: sessionExpiryMin * 60 * 1000 }
  })
);


/* =========================================
   SESSION MIDDLEWARE 🟥
   🟥 RED = Critical: Must be before routes that use session
========================================= */
// Make session available in EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Extend session on activity
app.use((req, res, next) => {
  if (req.session.user) req.session.touch();
  next();
});

// Disable caching
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});


/* =========================================
   PUBLIC PAGE ROUTES 🟥
   🟥 RED = Critical: Must come after middleware
========================================= */
const publicPages = ["login", "register", "forgot"];
publicPages.forEach(page => {
  app.get(`/authentication/${page === "index" ? "" : page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});

app.get("/about", (req, res) => {
  res.render(`pages/${getDevice(req)}/about`);
});

/* =========================================
   FOOTER PAGE ROUTES 🟥
   🟥 RED = Critical: Must come after middleware
========================================= */
const footerPages = ["disclaimer", "privacy", "terms"];
footerPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});


/* =========================================
   PROTECTED PAGE ROUTES 🟥
   🟥 RED = Critical: Must come after session middleware
========================================= */
app.get("/leaderboard", requireLogin, (req, res) => {
  res.render(`pages/${getDevice(req)}/leaderboard`);
});


/* =========================================
   APPLICATION ROUTES 🟥
   🟥 RED = Critical: Must come after middleware
========================================= */
app.use("/", require("./routes/index"));
app.use("/admin", require("./routes/admin"));
app.use("/user", require("./routes/user"));
app.use("/units", require("./routes/unit"));
app.use("/topics", require("./routes/topic"));
app.use("/mocktest", require("./routes/mocktest"));
app.use("/aiassistant", require("./routes/aiAssistant"));
app.use("/authentication", require("./routes/authentication"));

/* =========================================
   SESSION KEEP-ALIVE ENDPOINT 🟥
   🟥 RED = Critical: Must come after session middleware
========================================= */
app.get("/keep-session-alive", (req, res) => {
  if (req.session.user) {
    req.session.touch();
    return res.sendStatus(200);
  }
  res.sendStatus(401);
});


/* =========================================
   404 HANDLER 🟥
   🟥 RED = Critical: Must be after all routes
========================================= */
app.use((req, res) => {
  res.status(404).render("errors/404");
});


/* =========================================
   ERROR HANDLING 🟥
   🟥 RED = Critical: Must be last
========================================= */
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.url} - GLOBAL ERROR: ${err.message}`, {
    stack: err.stack,
    user: req.session?.username || "Guest",
    ip: req.ip,
    body: req.method === 'POST' ? req.body : undefined
  });

  const errorMessage = process.env.PRODUCTION === 'true'
    ? "Something went wrong on our end. Please try again later."
    : err.message;

  res.status(500).json({
    success: false,
    message: errorMessage
  });
});


/* =========================================
   START SERVER 🟩
   🟩 GREEN = Flexible: Can start server at end
========================================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});