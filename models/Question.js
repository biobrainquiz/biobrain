const mongoose = require("mongoose");
const { validateExistence, cascadeDelete } = require("../utils/dbHelpers");

const questionSchema = new mongoose.Schema({
  qno: { type: Number, required: true },
  examcode: { type: String, required: true, uppercase: true, trim: true },
  subjectcode: { type: String, required: true, uppercase: true,  trim: true },
  unitcode: { type: String, required: true, uppercase: true,  trim: true },
  topiccode: { type: String, required: true, uppercase: true, trim: true },
  question: { type: String, required: true, trim: true },
  opt1: { type: String, required: true, trim: true },
  opt2: { type: String, required: true, trim: true },
  opt3: { type: String, required: true, trim: true },
  opt4: { type: String, required: true, trim: true },
  answer: { type: Number, required: true, min: 1, max: 4 },
  difficulty_level: { type: String, required: true,  enum: ["easy", "hard"] },
  marks: { type: Number, required: true, min: 1},

  // This enables population
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true }
}, { timestamps: true });

// Compound index
questionSchema.index({ examcode: 1, subjectcode: 1, unitcode: 1, topiccode: 1, qno: 1 }, { unique: true });

// Pre-save validation
questionSchema.pre("save", async function (next) {
  const Exam = require("./Exam");
  const Subject = require("./Subject");
  const Unit = require("./Unit");
  const Topic = require("./Topic");

  await validateExistence(Exam, { examcode: this.examcode }, `Exam ${this.examcode} does not exist`);
  await validateExistence(Subject, { examcode: this.examcode, subjectcode: this.subjectcode }, `Subject ${this.subjectcode} does not exist`);
  await validateExistence(Unit, { examcode: this.examcode, subjectcode: this.subjectcode, unitcode: this.unitcode }, `Unit ${this.unitcode} does not exist`);
  await validateExistence(Topic, { examcode: this.examcode, subjectcode: this.subjectcode, unitcode: this.unitcode, topiccode: this.topiccode }, `Topic ${this.topiccode} does not exist`);
});

module.exports = mongoose.model("Question", questionSchema);