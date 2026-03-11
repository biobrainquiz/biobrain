// Middleware
const express = require("express");
const router = express.Router();

const requireLogin = require("../middleware/requireLogin");
router.use(requireLogin);

const authorize = require("../middleware/authorize");
router.use(authorize("admin")); // protects all admin routes

// Controllers
const examController = require("../controllers/admin/examController");
const subjectController = require("../controllers/admin/subjectController");
const unitController = require("../controllers/admin/unitController");
const topicController = require("../controllers/admin/topicController");
const userroleController = require("../controllers/admin/userroleController");
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


// =====================
// TOPICS
// =====================
router.get("/topics", topicController.list);
router.post("/topics/create", topicController.create);
router.post("/topics/update/:id", topicController.update);
router.post("/topics/delete", topicController.delete);


// =====================
// QUESTIONS
// =====================
router.get("/questions", questionController.list);
router.post("/questions/create", questionController.create);
router.post("/questions/update/:id", questionController.update);
router.post("/questions/delete", questionController.delete);

router.get("/userroles",userroleController.usersRoles);
router.post("/users/add-role",userroleController.addRole);
router.post("/users/remove-role",userroleController.removeRole);



// routes/adminLogs.js
router.get("/admin/logs", (req, res) => {
    res.render(`pages/${getDevice(req)}/admin/logs`, {
        logTypes: ["info", "error"],  // for old logs dropdown
        username: req.session?.username || "ADMIN"
    });
});

module.exports = router;