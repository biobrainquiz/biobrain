const fs = require("fs");
const path = require("path");
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Topic = require("../models/Topic");
const Question = require("../models/Question");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Role = require("../models/Role"); // correct path to your Role model
const logger = require("./logger");

function isForcedSeedingExamDbInEnv() {
  try {
    return process.env.FORCED_SEEDING_EXAMDB === "true";
  } catch (err) {
    logger.error({
      message: "envirnonment variable process.env.FORCED_SEEDING_EXAMDB Missing",
      error: err.message,
      stack: err.stack
    });
    return false;
  }
}

function isForcedSeedingUserRolesDbInEnv() {
  try {
    return process.env.FORCED_SEEDING_USER_ROLES_DB === "true";
  } catch (err) {
    logger.error({
      message: "envirnonment variable process.env.FORCED_SEEDING_USER_ROLES_DB Missing",
      error: err.message,
      stack: err.stack
    });
    return false;
  }
}

async function autoSeed(requestFromDashboard, source) {
  try {
    if (!requestFromDashboard) {//autoseed request when server started and hence autoseed as per process.env flags
      await autoSeedExamDb(source, isForcedSeedingExamDbInEnv());
      await autoSeedUserRolesDb(isForcedSeedingUserRolesDbInEnv());
    } else { //order from dashboard to seed Exam databse to factory or recent bkup point irrespective of process.env flags
      await autoSeedExamDb(source,true);
    }
  }
  catch (err) {
    logger.error({
      message: "❌ Auto seeding failed",
      error: err.message,
      stack: err.stack
    });
  }
}

async function autoSeedUserRolesDb(forcedSeedingUserRolesDbInEnv) {
  try {

    if (!forcedSeedingUserRolesDbInEnv) {
      logger.info("✅ Forced seeding of UserRoles Database disabled. Skipping...");
      return;
    }
    else {

      logger.info("🔥  Forced seeding of UserRoles Database enabled.");
      logger.info("⚠ Clearing old Users...");
      await User.deleteMany();

      logger.info("⚠ Clearing old Roles...");
      await Role.deleteMany({});
    }

    logger.info("⚡ Seeding UserRoles Database ...");

    //start
    // 2️⃣ Load JSON
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/usertable.json`)));
    const RolesData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/roletable.json`)));

    // 3️⃣ Insert Roles first
    const roles = await Role.insertMany(RolesData); // roles[i]._id available
    logger.info(`🔥 Roles seeded: ${roles.length} successfully!`);

    // 4 Insert Users
    const users = await User.insertMany(usersData);
    logger.info(`🔥 Users seeded: ${users.length} successfully!`);

    logger.info("✅ All UserRole Database seeded successfully!");

  }
  catch (err) {
    logger.error({
      message: "❌ Auto seeding failed",
      error: err.message,
      stack: err.stack
    });
  }
}

async function autoSeedExamDb(source,forcedSeedingExamDbInEnv) {
  try {
    if (!forcedSeedingExamDbInEnv) {
      logger.info("✅ Forced seeding of Exam Database disabled. Skipping...");
      return;
    }
    else {

      logger.info("🔥  Forced seeding of Exam Database enabled.");

      logger.info("⚠ Clearing old Questions...");
      await Question.deleteMany({});

      logger.info("⚠ Clearing old Topics...");
      await Topic.deleteMany();

      logger.info("⚠ Clearing old Units...");
      await Unit.deleteMany();

      logger.info("⚠ Clearing old Subjects...");
      await Subject.deleteMany();

      logger.info("⚠ Clearing old Exams...");
      await Exam.deleteMany();

      logger.info("⚠ Clearing old Payments...");
      await Payment.deleteMany({});
    }

    logger.info("⚡ Seeding Exam database...");

    //start
    // 2️⃣ Load JSON
    const examsData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/${source}/examtable.json`)));
    const subjectsData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/${source}/subjecttable.json`)));
    const unitsData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/${source}/unittable.json`)));
    const topicsData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/${source}/topictable.json`)));
    const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/${source}/questiontable.json`)));
    const paymentsData = JSON.parse(fs.readFileSync(path.join(__dirname, `../datafeed/${source}/paymenttable.json`)));

    // 3️⃣ Insert Exams first
    const exams = await Exam.insertMany(examsData); // exams[i]._id available
    logger.info(`🔥 Exam seeded: ${exams.length} successfully!`);

    // 4️⃣ Insert Subjects with exam _id
    const subjectsToInsert = subjectsData.map((sub, i) => {
      const exam = exams.find(e => e.examcode === sub.examcode);
      return { ...sub, exam: exam._id };
    });
    const subjects = await Subject.insertMany(subjectsToInsert);
    logger.info(`🔥 Subject seeded: ${subjects.length} successfully!`);

    // 5️⃣ Insert Units with exam & subject _id
    const unitsToInsert = unitsData.map(u => {
      const exam = exams.find(e => e.examcode === u.examcode);
      const subject = subjects.find(s => s.subjectcode === u.subjectcode && s.exam.equals(exam._id));
      return { ...u, exam: exam._id, subject: subject._id };
    });
    const units = await Unit.insertMany(unitsToInsert);
    logger.info(`🔥 Unit seeded: ${units.length} successfully!`);

    // 6️⃣ Insert Topics with exam, subject, unit _id
    const topicsToInsert = topicsData.map(t => {
      const exam = exams.find(e => e.examcode === t.examcode);
      const subject = subjects.find(s => s.subjectcode === t.subjectcode && s.exam.equals(exam._id));
      const unit = units.find(u => u.unitcode === t.unitcode && u.subject.equals(subject._id));
      return { ...t, exam: exam._id, subject: subject._id, unit: unit._id };
    });
    const topics = await Topic.insertMany(topicsToInsert);
    logger.info(`🔥 Topics seeded: ${topics.length} successfully!`);

    // 7️⃣ Insert Questions with exam, subject, unit, topic _id
    const questionsToInsert = questionsData.map(q => {
      const exam = exams.find(e => e.examcode === q.examcode);
      const subject = subjects.find(s => s.subjectcode === q.subjectcode && s.exam.equals(exam._id));
      const unit = units.find(u => u.unitcode === q.unitcode && u.subject.equals(subject._id));
      const topic = topics.find(t => t.topiccode === q.topiccode && t.unit.equals(unit._id));
      return { ...q, exam: exam._id, subject: subject._id, unit: unit._id, topic: topic._id };
    });
    await Question.insertMany(questionsToInsert);
    logger.info(`🔥 Questions seeded: ${questionsToInsert.length} successfully!`);
    logger.info("✅ All Exam database seeded successfully!");

  }
  catch (err) {
    logger.error({
      message: "❌ Auto seeding failed",
      error: err.message,
      stack: err.stack
    });
  }
}
module.exports = autoSeed;