const fs = require("fs");
const path = require("path");
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Topic = require("../models/Topic");
const Question = require("../models/Question");


function isForcedSeeding() {
  try {
    return process.env.FORCED_SEEDING === "true";
  } catch (err) {
    console.error("❌ isForcedSeeding Failed:", err);
    return false;
  }
}

async function autoSeed() {
  try {
    //const count = await Question.countDocuments();
    const forced = isForcedSeeding();

    if (!forced) {
      console.log("✅ Forced seeding disabled. Skipping...");
      return;
    }

    if (forced) {

      console.log("⚠ Forced seeding enabled.");
      
      console.log("⚠ Clearing old Questions...");
      await Question.deleteMany({});
      //console.log("⚠ Deleting Existing Questions Table...");
      //await mongoose.connection.dropCollection("questions");

      console.log("⚠ Clearing old Topics...");
      await Topic.deleteMany();
      //console.log("⚠ Deleting Existing Topics Table...");
      //await mongoose.connection.dropCollection("topics");


      console.log("⚠ Clearing old Units...");
      await Unit.deleteMany();
      //console.log("⚠ Deleting Existing Units Table...");
      //await mongoose.connection.dropCollection("unit");

      console.log("⚠ Clearing old Subjects...");
      await Subject.deleteMany();
      //console.log("⚠ Deleting Existing Subjects Table...");
      //await mongoose.connection.dropCollection("subjects");

      console.log("⚠ Clearing old Exams...");
      await Exam.deleteMany();
      //console.log("⚠ Deleting Existing Questions Table...");
      //await mongoose.connection.dropCollection("questions");
    }

    console.log("⚡ Seeding database...");

    const examTableDataFilePath = path.join(__dirname, "../quiz_data/examtable.json");
    const examTableData = JSON.parse(fs.readFileSync(examTableDataFilePath, "utf-8"));
    await Exam.insertMany(examTableData);
    console.log("🔥 Exam seeded successfully!");

    const subjectTableDataFilePath = path.join(__dirname, "../quiz_data/subjecttable.json");
    const subjectTableData = JSON.parse(fs.readFileSync(subjectTableDataFilePath, "utf-8"));
    await Subject.insertMany(subjectTableData);
    console.log("🔥 Subject seeded successfully!");


    const unitTableDataFilePath = path.join(__dirname, "../quiz_data/unittable.json");
    const unitTableData = JSON.parse(fs.readFileSync(unitTableDataFilePath, "utf-8"));
    await Unit.insertMany(unitTableData);
    console.log("🔥 Unit seeded successfully!");

    const topicTableDataFilePath = path.join(__dirname, "../quiz_data/topictable.json");
    const topicTableData = JSON.parse(fs.readFileSync(topicTableDataFilePath, "utf-8"));
    await Topic.insertMany(topicTableData);
    console.log("🔥 Topic seeded successfully!");

    const questionTableDataFilePath = path.join(__dirname, "../quiz_data/questiontable.json");
    const questionTableData = JSON.parse(fs.readFileSync(questionTableDataFilePath, "utf-8"));
    await Question.insertMany(questionTableData);
    console.log("🔥 Question seeded successfully!");

  } catch (err) {
    console.error("❌ Auto seeding failed:", err);
  }
}
module.exports = { autoSeed };