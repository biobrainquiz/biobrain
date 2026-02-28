require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const useragent = require("express-useragent");
const path = require("path");

const { autoSeed } = require("./utils/autoSeeder");
const requireLogin = require("./middleware/requireLogin");
const QuizResult = require("./models/QuizResult");
const Question = require("./models/Question");

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
  cookie: { maxAge: sessionExpiryMin  * 60 * 1000 } 
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
   Device Detection Helper
============================== */
function getDevice(req) {
  if (req.useragent.isMobile) return "mobile";
  if (req.useragent.isTablet) return "tablet";
  return "desktop";
}

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

// Protected Pages
app.get("/profile", requireLogin, (req, res) => {
  res.render(`pages/${getDevice(req)}/profile`);
});

app.get("/leaderboard", requireLogin, (req, res) => {
  res.render(`pages/${getDevice(req)}/leaderboard`);
});

app.get("/quizzes", requireLogin, (req, res) => {
  res.render(`pages/${getDevice(req)}/quizzes`);
});


/* ==============================
   Quiz Routes
============================== */

// Dynamic quiz start
app.get("/quiz/:exam/:subject/start", requireLogin, async (req, res) => {
  const { exam, subject } = req.params;
  const { count, difficulty } = req.query;
  const questions = await Question.aggregate([
    { $match: { exam, subject, difficulty_level: difficulty } },
    { $sample: { size: parseInt(count) } }
  ]);
  res.render(`pages/${getDevice(req)}/quiz`, { questions, exam, subject, user: req.session.user, count, difficulty });
});

// Prepare quiz (past performance)
app.get("/preparequiz/:exam/:subject", requireLogin, async (req, res) => {
  const device = getDevice(req);
  try {
    let { exam, subject } = req.params;
    exam = exam.toLowerCase();
    subject = subject.toLowerCase();

    const username = req.session.user.username;
    const page = parseInt(req.query.page) || 1;
    const pageLimit = 5;
    const resultsLimit = 50;

    const totalResults = await QuizResult.countDocuments({ username, exam, subject });
    const quizResults = await QuizResult.find({ username, exam, subject })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    quizResults.forEach(q => q.accuracy = ((q.right / q.noq) * 100).toFixed(2));

    const totalPages = Math.ceil(Math.min(totalResults, resultsLimit) / pageLimit);

    res.render(`pages/${device}/startquiz`, { exam, subject, quizResults, currentPage: page, totalPages });

  } catch (err) {
    console.error(err);
    res.render(`pages/${device}/startquiz`, { exam: req.params.exam, subject: req.params.subject, quizResults: [], currentPage: 1, totalPages: 1 });
  }
});

// Create order (session-based quiz config)
app.post("/create-order", requireLogin, (req, res) => {
  const { exam, subject, count, difficulty } = req.body;
  req.session.quizConfig = { exam, subject, count, difficulty };
  res.redirect(`/quiz/${exam}/${subject}/start?count=${count}&difficulty=${difficulty}`);
});

/* ==============================
   Logout
============================== */
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.redirect("/");
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

/* ==============================
   API / Other Routes
============================== */
app.use("/", require("./routes/reset"));
app.use("/api", require("./routes/register"));
app.use("/api", require("./routes/login"));
app.use("/api", require("./routes/forgot"));
app.use("/api/quiz", require("./routes/quiz"));

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