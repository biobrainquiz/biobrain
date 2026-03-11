
const autoSeed = require("../../utils/autoSeeder");
const exportDB = require("../../utils/exportDB");
const requestFromDashboard=true;

/* ===============================
   BACKUP DATABASE
================================ */

exports.backupDatabase = async (req, res) => {
    try {
        exportDB();
        res.json({ success: true, message: "Database backup created" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Backup failed" });
    }
};


/* ===============================
   FACTORY RESET
================================ */

exports.resetToFactory = async (req, res) => {
    try {
        // seed factory data
        await autoSeed(requestFromDashboard,"factory");
        res.json({ success: true, message: "Database reset to Factory state" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Factory reset failed" });
    }
};

/* ===============================
   RESTORE BACKUP
================================ */

exports.resetToLatestBackup = async (req, res) => {
    try {
        // seed latestbkup data
        await autoSeed(requestFromDashboard,"latestbkup");
        res.json({ success: true, message: "Database reset to Recent Backup state" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Restore From Recent Backup failed" });
    }
};