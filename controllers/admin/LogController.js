const fs = require("fs");
const path = require("path");
const logsBasePath = path.join(__dirname, "../../logs");

/* Render logs page */

exports.logsPage = (req, res) => {

    const logTypes = ["info", "error", "combined"];

    res.render("pages/desktop/admin/logs", {
        logTypes
    });

};



/* Get files of selected log type */

exports.getLogFiles = (req, res) => {

    const type = req.query.type;

    const dir = path.join(logsBasePath, type);

    if (!fs.existsSync(dir)) {
        return res.json([]);
    }

    const files = fs.readdirSync(dir);
      // filter files by prefix
   // filter files by prefix
    const filtered = files.filter(file =>
        file.startsWith(type)
    );
    res.json(filtered);

};



/* View selected log file */

exports.viewLogFile = (req, res) => {

    const { type, file } = req.query;

    const filePath = path.join(logsBasePath, type, file);

    if (!fs.existsSync(filePath)) {
        return res.send("Log file not found");
    }

    const content = fs.readFileSync(filePath, "utf8");

    res.send(`<pre>${content}</pre>`);

};

exports.downloadlogfile = (req, res) => {
    const { type, file } = req.query;

    const filePath = path.join(logsBasePath, type, file);

    if (!fs.existsSync(filePath)) {
        return res.send("Log file not found");      
    }

    res.download(filePath, file, (err) => {
        if (err) {
            console.error("Error downloading log file:", err);
            res.status(500).send("Error downloading log file");
        }
    });
}