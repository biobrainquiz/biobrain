const logger = require("../../utils/logger");
const autoSeed = require("../../utils/autoSeeder");
const exportDB = require("../../utils/exportDB");
const requestFromDashboard=true;

/* ===============================
   BACKUP DATABASE
================================ */

/**
 * Backup the database to a series of JSON files.
 * This is useful for saving a snapshot of the database for later use (e.g. testing).
 * The backup files are saved in the datafeed/latestbkup directory.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} - A promise that resolves when the backup is complete.
 */
exports.backupDatabase = async (req, res) => {
    try {
        // call the exportDB function to create the backup files
        exportDB();
        // return a success message to the client
        res.json({ success: true, message: "Database backup created" });

    } catch (err) {
        // log an error message if something goes wrong
        logger.error("backup Database error", err);
        // return an error message to the client
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
        logger.error("reset To Factory Database error", err);
        res.status(500).json({ success: false, message: "Factory reset failed" });
    }
};

/* ===============================
   RESTORE TO BACKUP
================================ */

exports.resetToLatestBackup = async (req, res) => {
    try {
        // seed latestbkup data
        await autoSeed(requestFromDashboard,"latestbkup");
        res.json({ success: true, message: "Database reset to Recent Backup state" });

    } catch (err) {
        logger.error("reset To LatestBackup Database error", err);
        res.status(500).json({ success: false, message: "Restore From Recent Backup failed" });
    }
};