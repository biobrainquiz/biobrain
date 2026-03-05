const fs = require("fs");
const path = require("path");

const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Topic = require("../models/Topic");
const Question = require("../models/Question");

async function exportDB() {

    const backupDir = path.join(__dirname, "../datafeed/latestbkup");

    // create directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const exams = await Exam.find().lean();
    const subjects = await Subject.find().lean();
    const units = await Unit.find().lean();
    const topics = await Topic.find().lean();
    const questions = await Question.find().lean();

    fs.writeFileSync(path.join(backupDir, "examtable.json"), JSON.stringify(exams, null, 2));
    fs.writeFileSync(path.join(backupDir, "subjecttable.json"), JSON.stringify(subjects, null, 2));
    fs.writeFileSync(path.join(backupDir, "unittable.json"), JSON.stringify(units, null, 2));
    fs.writeFileSync(path.join(backupDir, "topictable.json"), JSON.stringify(topics, null, 2));
    fs.writeFileSync(path.join(backupDir, "questiontable.json"), JSON.stringify(questions, null, 2));

    console.log("✅ Database exported to JSON files");

}

module.exports = { exportDB };