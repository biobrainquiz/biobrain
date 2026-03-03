require("dotenv").config();
const express = require("express");
const path = require("path");
const useragent = require("express-useragent");

const connectDB = require("./config/db");
const configureSession = require("./config/session");
const { autoSeed } = require("./utils/autoSeeder");
const requireLogin = require("./middleware/requireLogin");
const getDevice = require("./utils/getDevice");

const app = express();

/* ==========================
   Core Middleware
========================== */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

/* ==========================
   Routes
========================== */

// Public Pages
const publicPages = ["index", "about", "login", "register", "forgot"];
publicPages.forEach(page => {
  app.get(`/${page === "index" ? "" : page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});

// Footer Pages
["disclaimer", "privacy", "terms"].forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.render(`pages/${getDevice(req)}/${page}`);
  });
});

app.get("/leaderboard", (req, res) => {
  res.render(`pages/${getDevice(req)}/leaderboard`);
});

// Route Modules
app.use("/admin", require("./routes/admin"));
app.use("/", require("./routes/user"));
app.use("/", require("./routes/unit"));
app.use("/", require("./routes/topic"));
app.use("/", require("./routes/quiz"));
app.use("/", require("./routes/authRoutes"));

app.get("/keep-session-alive", (req, res) => {
  if (req.session.user) {
    req.session.touch();
    return res.sendStatus(200);
  }
  res.sendStatus(401);
});

// Global Error
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).send("Something broke!");
});

// 404
app.use((req, res) => {
  res.status(404).render("404");
});

module.exports = app;