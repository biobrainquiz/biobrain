const mongoose = require("mongoose");
const { cascadeDelete } = require("../utils/dbHelpers");

const examSchema = new mongoose.Schema({
  examname: { type: String, required: true, trim: true },
  examcode: { type: String, required: true, unique: true, uppercase: true, trim: true }
}, { timestamps: true });

// Cascade delete subjects, units, topics, questions
examSchema.pre("findOneAndDelete", async function(next) {
  const filter = this.getFilter();
  const Subject = require("./Subject");
  const Unit = require("./Unit");
  const Topic = require("./Topic");
  const Question = require("./Question");

  await cascadeDelete(Subject, { examcode: filter.examcode });
  await cascadeDelete(Unit, { examcode: filter.examcode });
  await cascadeDelete(Topic, { examcode: filter.examcode });
  await cascadeDelete(Question, { examcode: filter.examcode });

  next();
});

module.exports = mongoose.model("Exam", examSchema);