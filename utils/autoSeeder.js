const fs = require("fs");
const path = require("path");
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
    const count = await Question.countDocuments();
    const forced = isForcedSeeding();

    if (count > 0 && !forced) {
      console.log("✅ MCQs already exist & forced seeding disabled. Skipping...");
      return;
    }

    if (forced && count > 0) {
      console.log("⚠ Forced seeding enabled. Clearing old MCQs...");
      await Question.deleteMany({});
    }

    console.log("⚡ Seeding database...");

    const filePath = path.join(__dirname, "../quiz_data/gate_zoology.json");
    const questions = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    await Question.insertMany(questions);

    console.log("🔥 MCQs seeded successfully!");

  } catch (err) {
    console.error("❌ Auto seeding failed:", err);
  }
}

module.exports = { autoSeed };