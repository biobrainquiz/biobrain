const mongoose = require("mongoose");
const { cascadeDelete } = require("../utils/dbHelpers");

const examSchema = new mongoose.Schema({
  examname: { type: String, required: true, trim: true },
  examcode: { type: String, required: true, unique: true, uppercase: true, trim: true }
}, { timestamps: true });


// Cascade delete subjects, units, topics, questions
examSchema.pre("findOneAndDelete", async function () {

  const filter = this.getFilter();

  const Exam = mongoose.model("Exam");
  const exam = await Exam.findOne(filter);

  if (!exam) return;

  const Subject = require("./Subject");
  const Unit = require("./Unit");
  const Topic = require("./Topic");
  const Question = require("./Question");

  await cascadeDelete(Subject, { examcode: exam.examcode });
  await cascadeDelete(Unit, { examcode: exam.examcode });
  await cascadeDelete(Topic, { examcode: exam.examcode });
  await cascadeDelete(Question, { examcode: exam.examcode });

});

module.exports = mongoose.model("Exam", examSchema);