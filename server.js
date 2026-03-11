/* =========================================
   ENVIRONMENT VARIABLES
========================================= */
require("dotenv").config();


/* =========================================
   CORE MODULES
========================================= */
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");


/* =========================================
   SESSION & AUTH MODULES
========================================= */
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const useragent = require("express-useragent");


/* =========================================
   UTILITIES
========================================= */
const escapeHtml = require("./utils/escapeHtml");
const getDevice = require("./utils/getDevice");
const mapCodesToNames = require("./utils/mapCodesToNames");
const autoSeed = require("./utils/autoSeeder");
const logger = require("./utils/logger");


/* =========================================
   MIDDLEWARE
========================================= */
const errorHandler = require("./middleware/errorHandler");
const requireLogin = require("./middleware/requireLogin");


/* =========================================
   CONFIGURATION
========================================= */
const connectDB = require("./config/db");


/* =========================================
   DATABASE MODELS
========================================= */
const QuizResult = require("./models/QuizResult");
const Question = require("./models/Question");
const Unit = require("./models/Unit");
const Topic = require("./models/Topic");
const Exam = require("./models/Exam");


/* =========================================
   EXPRESS APPLICATION INITIALIZATION
========================================= */
const app = express();


/* =========================================
   DATABASE CONNECTION
========================================= */
const isProduction = process.env.PRODUCTION === "true";

const mongoURI = isProduction
  ? process.env.PRODUCTION_SERVER_MONGO_URI
  : process.env.LOCAL_SERVER_MONGO_URI;

mongoose.connect(mongoURI)
  .then(async () => {
    logger.info("✅ Connected to MongoDB");
    const requestFromDashboard=false;
    await autoSeed(requestFromDashboard,"factory");
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
   GLOBAL MIDDLEWARE
========================================= */

// Request Logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} ${req.ip}`);
  next();
});

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, "public")));

// Device Detection
app.use(useragent.express());


/* =========================================
   VIEW ENGINE CONFIGURATION
========================================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


/* =========================================
   SESSION CONFIGURATION
========================================= */
const sessionExpiryMin =
  parseInt(process.env.SESSION_EXPIRY_IN_MIN) || 15;

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
   SESSION MIDDLEWARE
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
   PUBLIC PAGE ROUTES
========================================= */
const publicPages = ["index", "about", "login", "register", "forgot"];

publicPages.forEach(page => {
  app.get(`/${page === "index" ? "" : page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});


/* =========================================
   FOOTER PAGE ROUTES
========================================= */
const footerPages = ["disclaimer", "privacy", "terms"];

footerPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});


/* =========================================
   PROTECTED PAGE ROUTES
========================================= */
app.get("/leaderboard", requireLogin, (req, res) => {
  res.render(`pages/${getDevice(req)}/leaderboard`);
});


/* =========================================
   APPLICATION ROUTES
========================================= */
app.use("/admin", require("./routes/admin"));
app.use("/", require("./routes/user"));
app.use("/", require("./routes/unit"));
app.use("/", require("./routes/topic"));
app.use("/", require("./routes/quiz"));
app.use("/", require("./routes/authRoutes"));


/* =========================================
   SESSION KEEP-ALIVE ENDPOINT
========================================= */
app.get("/keep-session-alive", (req, res) => {
  if (req.session.user) {
    req.session.touch();
    return res.sendStatus(200);
  }
  res.sendStatus(401);
});




/* =========================================
   404 HANDLER
========================================= */
app.use((req, res) => {
  res.status(404).render("errors/404");
});

/* =========================================
   ERROR HANDLING
========================================= */

// Global error handler
app.use((err, req, res, next) => {
  //console.error("GLOBAL ERROR:", err);
  logger.error({
      message: "GLOBAL ERROR",
      error: err.message,

      stack: err.stack
    });
  res.status(500).send("Something broke!");
});

const liveLogs = require("./utils/liveLogs");

const http = require("http");
const WebSocket = require("ws");

const server = http.createServer(app);

// Setup WebSocket server
const wss = new WebSocket.Server({ server, path: "/logs" });

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

// Broadcast helper
wss.broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

const ws = new WebSocket("ws://localhost:3000/logs");
app.get("/admin/logs/live", (req, res) => {
  res.render("pages/admin/liveLogs"); // your EJS page
});

// Example: send a log every 5 seconds
setInterval(() => {
  const log = { time: new Date().toLocaleTimeString(), message: "Test log entry" };
  wss.broadcast(log);
}, 5000);

/* =========================================
   START SERVER
========================================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});