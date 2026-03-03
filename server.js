process.on("uncaughtException", err => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
  console.error("UNHANDLED REJECTION:", err);
});

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const useragent = require("express-useragent");
const path = require("path");
const mapCodesToNames = require("./utils/mapCodesToNames");
const { autoSeed } = require("./utils/autoSeeder");
const requireLogin = require("./middleware/requireLogin");
const QuizResult = require("./models/QuizResult");
const Question = require("./models/Question");
const Unit = require("./models/Unit");
const Topic = require("./models/Topic");
const Exam = require("./models/Exam");
const escapeHtml = require("./utils/escapeHtml");
const getDevice = require("./utils/getDevice");

const app = express();

/* ==============================
   Environment & MongoDB
============================== */
const isProduction = process.env.PRODUCTION === "true";
const mongoURI = isProduction
  ? process.env.PRODUCTION_SERVER_MONGO_URI
  : process.env.LOCAL_SERVER_MONGO_URI;

mongoose.connect(mongoURI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await autoSeed(); // optional seeding
  })
  .catch(err => console.log("❌ MongoDB connection error:", err));

/* ==============================
   Session Middleware
============================== */
const sessionExpiryMin = parseInt(process.env.SESSION_EXPIRY_IN_MIN) || 15; // default 15 minutes
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

// Extend session on activity
app.use((req, res, next) => {
  if (req.session.user) req.session.touch();
  next();
});

// Disable cache
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ==============================
   View Engine & Middleware
============================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());


/* ==============================
   Page Routes
============================== */

// Public Pages
const publicPages = ["index", "about", "login", "register", "forgot"];
publicPages.forEach(page => {
  app.get(`/${page === "index" ? "" : page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});

// Footer Pages
const footerPages = ["disclaimer", "privacy", "terms"];
footerPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});

app.get("/leaderboard", requireLogin, (req, res) => {
  res.render(`pages/${getDevice(req)}/leaderboard`);
});


/* ==============================
   API / Other Routes
============================== */
// Route Modules
app.use("/admin", require("./routes/admin"));
app.use("/", require("./routes/user"));
app.use("/", require("./routes/unit"));
app.use("/", require("./routes/topic"));
app.use("/", require("./routes/quiz"));
app.use("/", require("./routes/authRoutes"));


app.get("/keep-session-alive", (req, res) => {
  if (req.session.user) {
    // touch the session to reset expiry
    req.session.touch();
    return res.sendStatus(200);
  }
  res.sendStatus(401);
});

app.use((err, req, res, next) => {
    console.error("GLOBAL ERROR:", err);
    res.status(500).send("Something broke!");
});

/* ==============================
   404 Handler
============================== */
app.use((req, res) => {
  res.status(404).render("404");
});

/* ==============================
   Start Server
============================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));