require("dotenv").config();

const { autoSeed } = require("./utils/autoSeeder");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const useragent = require("express-useragent");
const path = require("path");
const router = express.Router();
const requireLogin = require("./middleware/requireLogin");
const QuizResult = require("./models/QuizResult");
const Question = require("./models/Question");

const app = express();

/* ==============================
   Environment Detection
============================== */

const isProduction = process.env.PRODUCTION === "true";

process.env.MONGO_URI = isProduction
  ? process.env.PRODUCTION_SERVER_MONGO_URI
  : process.env.LOCAL_SERVER_MONGO_URI;

process.env.BASE_URI = isProduction
  ? process.env.PRODUCTION_SERVER_BASE_URI
  : process.env.LOCAL_SERVER_BASE_URI;

const mongoURI = process.env.MONGO_URI;

/* ==============================
   MongoDB Connection
============================== */

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await autoSeed();   // 🔥 THIS LINE

  })
  .catch((err) => console.log("❌ MongoDB connection error:", err));

/*mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));*/

/* ==============================
   Session Middleware
============================== */

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
    }),
    cookie: {
      maxAge: 15 * 60 * 1000, // 15 minutes
    },
  })
);

/* ==============================
   Cache Control
============================== */

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

/* ==============================
   Make Session Available to EJS
============================== */

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

/* ==============================
   Extend Session on Activity
============================== */

app.use((req, res, next) => {
  if (req.session.user) {
    req.session.touch();
  }
  next();
});

/* ==============================
   View Engine Setup
============================== */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ==============================
   General Middleware
============================== */

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

/* ==============================
   Device Detection
============================== */

function getDevice(req) {
  if (req.useragent.isMobile) return "mobile";
  if (req.useragent.isTablet) return "tablet";
  return "desktop";
}

/* ==============================
   Models
============================== */

const Quiz = require("./models/Question");

/* ==============================
   Page Routes
============================== */

app.get("/", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/index`);
});

app.get("/about", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/about`);
});

app.get("/login", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/login`);
});

app.get("/register", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/register`);
});

app.get("/forgot", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/forgot`);
});

/* ==============================
   🔥 Dynamic Quiz Page Route
   Example:
   /quiz?numQuestions=10&difficulty=medium
============================== */

app.get("/quiz1", requireLogin, async (req, res) => {
  try {
    const device = getDevice(req);

    const difficulty = req.query.difficulty || "hard";

    const all = await Quiz.find();
    const questions = await Quiz.aggregate([
      { $match: { difficulty_level: difficulty, exam: "gate" } },
      { $sample: { size: 20 } }
    ]);

    res.render(`pages/${device}/quiz`, { questions });

  } catch (err) {
    console.error("Quiz load error:", err);
    res.status(500).send("Error loading quiz");
  }
});

// rest style quiz
app.get("/quiz/:exam/:subject/start", requireLogin, async (req, res) => {

  const device = getDevice(req);
  const { exam, subject } = req.params;
  const { count, difficulty } = req.query;
  const questions = await Question.aggregate([
    {
      $match: {
        exam: exam,
        subject: subject,
        difficulty_level: difficulty
      }
    },
    { $sample: { size: parseInt(count) } }
  ]);
  res.render(`pages/${device}/quiz`, {
    questions,
    exam,
    subject,
    user: req.session.user,      // contains username
    count,
    difficulty
  });
});

app.get("/preparequiz/:exam/:subject", requireLogin, async (req, res) => {

  try {
    let { exam, subject } = req.params;

    const userId = req.session.user._id;
    exam = exam.toLowerCase();
    subject = subject.toLowerCase();

    // start of past exam performance
    const username = req.session.user.username; // logged-in user
    const page = parseInt(req.query.page) || 1; // current page
    const pageLimit = 5; // results per page
    const resultsLimit = 50; // maximum past performances

    // Count total attempts
    const totalResults = await QuizResult.countDocuments({ username, exam, subject });

    // Fetch results sorted by latest
    const quizResults = await QuizResult.find({ username, exam, subject })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    // Calculate accuracy for each
    quizResults.forEach(q => {
      q.accuracy = ((q.right / q.noq) * 100).toFixed(2);
    });

    const totalPages = Math.ceil(Math.min(totalResults, resultsLimit) / pageLimit); // max 50 results
    // end of past exam performance


    /*const userId = req.session.user._id;
    const previousStats = await QuizResult.findOne({
        user: userId,
        exam,
        subject
    }).sort({ createdAt: -1 });*/

    const device = getDevice(req);
    res.render(`pages/${device}/startquiz`, {
      exam,
      subject,
      quizResults,
      currentPage: page,
      totalPages
    });
  }
  catch (err) {
    console.error(err);
    res.render(`pages/${device}/startquiz`, {
      exam,
      subject,
      quizResults: [],
      currentPage: 1,
      totalPages: 1
    });
  }
});

app.post("/create-order", requireLogin, async (req, res) => {

  const { exam, subject, count, difficulty } = req.body;
  // Save quiz config temporarily in session
  req.session.quizConfig = {
    exam,
    subject,
    count,
    difficulty
  };

  // After payment success redirect here
  res.redirect(`/quiz/${exam}/${subject}/start?count=${count}&difficulty=${difficulty}`);
});


app.get("/profile", requireLogin, (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/profile`);
});

app.get("/leaderboard", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/leaderboard`);
});

app.get("/quizzes", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/quizzes`);
});



/* ==============================
   Logout
============================== */

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout error:", err);
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

/* ==============================
   Footer Pages
============================== */

app.get("/disclaimer", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/disclaimer`);
});

app.get("/privacy", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/privacy`);
});

app.get("/terms", (req, res) => {
  const device = getDevice(req);
  res.render(`pages/${device}/terms`);
});

/* ==============================
   API Routes
============================== */

app.use("/", require("./routes/reset"));
app.use("/api", require("./routes/register"));
app.use("/api", require("./routes/login"));
app.use("/api", require("./routes/forgot"));
app.use("/api/quiz", require("./routes/quiz"));


/* ==============================
   404
============================== */

app.use((req, res) => {
  res.status(404).render("404");
});

/* ==============================
   Start Server
============================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);