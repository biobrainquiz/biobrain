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
const databaseBkupController = require("../controllers/admin/databaseBkupController");

// =====================
// DASHBOARD
// =====================
router.get("/", dashboardController.index);

router.post("/reset/factory", databaseBkupController.resetToFactory);
router.post("/reset/backup", databaseBkupController.resetToLatestBackup);
router.post("/backup", databaseBkupController.backupDatabase);

// GET all exams
router.get("/exams", examController.list);
router.post("/exams/update/:id", examController.update);
router.post("/exams/delete/:id", examController.remove);
router.post("/exams/create", examController.create);

// =====================
// SUBJECTS
// =====================
router.get("/subjects", subjectController.list);
router.post("/subjects/create", subjectController.create);
router.post("/subjects/update/:id", subjectController.update);
router.post("/subjects/delete/:id", subjectController.delete);


    /*
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
router.post("/questions/:id/delete", questionController.remove);*/


module.exports = router;