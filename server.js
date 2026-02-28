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
const Unit=require("./models/Unit");
const Topic=require("./models/Topic");

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
app.get("/quiz/:examcode/:subjectcode/:unitcode/:topiccode/start", requireLogin, async (req, res) => {
  const { examcode, subjectcode,unitcode,topiccode } = req.params;
  const { count, difficulty } = req.query;
  const questions = await Question.aggregate([
    { $match: { examcode:examcode, subjectcode:subjectcode, unitcode:unitcode,topiccode:topiccode,difficulty_level: difficulty } },
    { $sample: { size: parseInt(count) } }
  ]);
  console.log(questions);
  res.render(`pages/${getDevice(req)}/quiz`, { questions, examcode, subjectcode,unitcode,topiccode, user: req.session.user, count, difficulty });
});

// Prepare quiz (past performance)
app.get("/preparequiz/:examcode/:subjectcode", requireLogin, async (req, res) => {
  const device = getDevice(req);
  try {
    let { examcode, subjectcode } = req.params;

    const username = req.session.user.username;
    const page = parseInt(req.query.page) || 1;
    const pageLimit = 5;
    const resultsLimit = 50;

    const totalResults = await QuizResult.countDocuments({ username, examcode, subjectcode });
    const quizResults = await QuizResult.find({ username, examcode, subjectcode })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    quizResults.forEach(q => q.accuracy = ((q.right / q.noq) * 100).toFixed(2));

    const totalPages = Math.ceil(Math.min(totalResults, resultsLimit) / pageLimit);

    res.render(`pages/${device}/startquiz`, { examcode, subjectcode, quizResults, currentPage: page, totalPages });

  } catch (err) {
    console.error(err);
    res.render(`pages/${device}/startquiz`, { examcode: req.params.examcode, subjectcode: req.params.subjectcode, quizResults: [], currentPage: 1, totalPages: 1 });
  }
});

// Create order (session-based quiz config)
app.post("/create-order", requireLogin, (req, res) => {
  const { examcode, subjectcode, unitcode,topiccode,count, difficulty } = req.body;
  req.session.quizConfig = { examcode, subjectcode,unitcode,topiccode, count, difficulty };
  res.redirect(`/quiz/${examcode}/${subjectcode}/${unitcode}/${topiccode}/start?count=${count}&difficulty=${difficulty}`);
});

app.get("/api/units/:examcode/:subjectcode", requireLogin, async (req, res) => {
  try {
    const { examcode, subjectcode } = req.params;
    const units = await Unit.find({ examcode, subjectcode })
      .sort({ unitcode: 1 })
      .select("unitcode unitname -_id")
      .lean();
    res.json(units);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.get("/api/topics/:examcode/:subjectcode/:unitcode", requireLogin, async (req, res) => {
  try {
    const { examcode, subjectcode, unitcode } = req.params;
    const topics = await Topic.find({ examcode, subjectcode, unitcode })
      .sort({ topiccode: 1 })
      .select("topiccode topicname -_id")
      .lean();

    res.json(topics);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
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