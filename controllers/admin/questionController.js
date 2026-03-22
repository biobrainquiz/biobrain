const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const Exam = require("../../models/Exam");
const getDevice = require("../../utils/getDevice"); 
const logger = require("../../utils/logger");

// ================= LIST =================
exports.list = async (req, res) => {

  try {

    const exams = await Exam.find().sort({ examname: 1 });
    const subjects = await Subject.find().populate("exam").sort({ subjectname: 1 });
    const units = await Unit.find()
      .populate("exam")
      .populate("subject")
      .sort({ unitname: 1 });
    const topics = await Topic.find()
      .populate("exam")
      .populate("subject")
      .populate("unit")
      .sort({ topicname: 1 });

    const questions = await Question.find()
      .populate("exam")
      .populate("subject")
      .populate("unit")
      .populate("topic")
      .sort({ qno: 1 });

    res.render(`pages/${getDevice(req)}/admin/questions/question`, {
      exams,
      subjects,
      units,
      topics,
      questions,
    });

  } catch (err) {
    logger.error("Error Listing questions:", err);
    res.status(500).send("Server Error");
  }
};

// ================= CREATE =================
exports.create = async (req, res) => {
  try {
    const { examId, subId, unitId, topicId, examCode, subCode, unitCode, topicCode, qno, question, opt1, opt2, opt3, opt4, answer, difficulty, marks } = req.body;
    if (!examId || !subId || !unitId || !topicId || !examCode || !subCode || !unitCode || !topicCode || !qno || !question || !opt1 || !opt2 || !opt3 || !opt4 || !answer || !difficulty || !marks) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const existing = await Question.findOne({ qno: qno, topiccode: topicCode });
    if (existing) return res.json({ success: false, message: "Question already exists under this topic" });

    const newQuestion = await Question.create({
      exam: examId,
      subject: subId,
      unit: unitId,
      topic: topicId,
      examcode: examCode,
      subjectcode: subCode,
      unitcode: unitCode,
      topiccode: topicCode,
      qno: qno,
      question: question,
      opt1: opt1,
      opt2: opt2,
      opt3: opt3,
      opt4: opt4,
      answer: answer,
      difficulty_level: difficulty,
      marks: marks
    });

    res.json({ success: true, question: newQuestion });
  } catch (err) {
    logger.error("Error creating question:", err);
    res.json({ success: false, message: "Server error" });
  }
};

// ================= UPDATE =================
exports.update = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      question,
      opt1,
      opt2,
      opt3,
      opt4,
      answer,
      marks,
      difficulty
    } = req.body;


    // basic validation
    if (!question || !opt1 || !opt2 || !opt3 || !opt4 || !answer || !marks || !difficulty) {
      return res.json({
        success: false,
        message: "All fields are required"
      });
    }


    // update question
    await Question.findByIdAndUpdate(
      id,
      {
        question,
        opt1,
        opt2,
        opt3,
        opt4,
        answer,
        marks,
        difficulty_level: difficulty
      }
    );

    res.json({
      success: true,
      message: "Question updated successfully"
    });

  } catch (err) {
    logger.error("Error Updating Question:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE via POST
exports.delete = async (req, res) => {
  try {
    const { qid } = req.body;  // <-- receive question ID via POST body
    if (!qid) return res.json({ success: false, message: "Qqestion ID required" });

    await Question.findByIdAndDelete(qid);
    res.json({ success: true });
  } catch (err) {
    logger.error("Error deleting question:", err);
    res.json({ success: false, message: "Server error" });
  }
};