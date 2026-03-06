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
const logController = require("../controllers/admin/LogController");

//const { addClient, removeClient } = require("../utils/liveLogs");

router.get("/logs", logController.logsPage);
router.get("/logs/files", logController.getLogFiles);
router.get("/logs/view", logController.viewLogFile);
router.get("/logs/download", logController.downloadlogfile);

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
router.post("/exams/delete/:id", examController.delete);
router.post("/exams/create", examController.create);

// =====================
// SUBJECTS
// =====================
router.get("/subjects", subjectController.list);
router.post("/subjects/create", subjectController.create);
router.post("/subjects/update/:id", subjectController.update);
router.post("/subjects/delete/:id", subjectController.delete);



/* =============================
   UNITS 
============================= */

router.get("/units", unitController.list);
router.post("/units/create", unitController.create);
router.post("/units/update/:id", unitController.update);
router.delete("/units/:id", unitController.delete);
router.get("/api/subjects/:examcode", unitController.getSubjectsByExam);

/*
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



// routes/adminLogs.js


router.get("/admin/logs/live", (req, res) => {

    res.render(`pages/${getDevice(req)}/admin/liveLogs`, {
        username: req.session?.username || "ADMIN"
    });

});

module.exports = router;

//module.exports = { router, sendLog };