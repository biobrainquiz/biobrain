// models/QuizResult.js
const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
  sno: { type: Number },
  examdate: { type: String },
  examtime: { type: String },
  username: { type: String, required: true },
  examcode: { type: String, required: true },
  subjectcode: { type: String, required: true },
  unitcode: { type: String, required: true },
  topiccode: { type: String, required: true },
  difficulty: { type: String, required: true },
  noq: { type: Number, required: true },
  attempted: { type: Number, required: true },
  right: { type: Number, required: true },
  wrong: { type: Number, required: true },
  score: { type: Number, required: true },
}, { timestamps: true }); // this adds createdAt & updatedAt automatically

module.exports = mongoose.model("QuizResult", quizResultSchema);