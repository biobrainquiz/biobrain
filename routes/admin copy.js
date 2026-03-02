console.log("Admin router file loaded");
const express = require("express");
const router = express.Router();

// Middleware
const requireLogin = require("../middleware/requireLogin");
router.use(requireLogin);
// Controllers
const examController = require("../controllers/admin/examController");
const subjectController = require("../controllers/admin/subjectController");
const unitController = require("../controllers/admin/unitController");
const topicController = require("../controllers/admin/topicController");
const questionController = require("../controllers/admin/questionController");
const dashboardController = require("../controllers/admin/dashboardController");
// Protect all admin routes


// =====================
// DASHBOARD
// =====================
//router.get("/", dashboardController.index);

router.get("/", (req, res, next) => {
    console.log("Admin route hit");
    next();
}, dashboardController.index);

/*router.get("/", (req, res) => {
  res.render(`pages/${getDevice(req)}/admin/dashboard`);
});*/

// =====================
// EXAMS
// =====================
router.get("/exams", examController.list);
router.get("/exams/new", examController.showCreate);
router.post("/exams", examController.create);
router.get("/exams/:id/edit", examController.showEdit);
router.post("/exams/:id", examController.update);
router.post("/exams/:id/delete", examController.remove);

// =====================
// SUBJECTS
// =====================
router.get("/subjects", subjectController.list);
router.get("/subjects/new", subjectController.showCreate);
router.post("/subjects", subjectController.create);
router.get("/subjects/:id/edit", subjectController.showEdit);
router.post("/subjects/:id", subjectController.update);
router.post("/subjects/:id/delete", subjectController.remove);

// =====================
// UNITS
// =====================
router.get("/units", unitController.list);
router.get("/units/new", unitController.showCreate);
router.post("/units", unitController.create);
router.get("/units/:id/edit", unitController.showEdit);
router.post("/units/:id", unitController.update);
router.post("/units/:id/delete", unitController.remove);

// =====================
// TOPICS
// =====================
router.get("/topics", topicController.list);
router.get("/topics/new", topicController.showCreate);
router.post("/topics", topicController.create);
router.get("/topics/:id/edit", topicController.showEdit);
router.post("/topics/:id", topicController.update);
router.post("/topics/:id/delete", topicController.remove);

// =====================
// QUESTIONS
// =====================
router.get("/questions", questionController.list);
router.get("/questions/new", questionController.showCreate);
router.post("/questions", questionController.create);
router.get("/questions/:id/edit", questionController.showEdit);
router.post("/questions/:id", questionController.update);
router.post("/questions/:id/delete", questionController.remove);

module.exports = router;