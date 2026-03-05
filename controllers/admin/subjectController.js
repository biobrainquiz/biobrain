const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const QuizResult = require("../../models/QuizResult");
const Payment = require("../../models/Payment"); // if exists
const Exam = require("../../models/Exam");
const getDevice = require("../../utils/getDevice"); // if you use device-based views

exports.list = async (req, res) => {

  try {

    const subjects = await Subject.find()
      .populate("exam")
      .sort({ createdAt: -1 });

    const exams = await Exam.find().sort({ examname: 1 });

    res.render(`pages/${getDevice(req)}/admin/subjects/subject`, {
      subjects,
      exams
    });

  } catch (err) {

    console.error("Error loading subjects:", err);
    res.status(500).send("Server Error");

  }

};

exports.create = async (req, res) => {
  try {

    const { examId, examcode, subjectname, subjectcode } = req.body;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.json({ success: false, message: "Exam not found" });
    }

    const subject = await Subject.create({
      exam: examId,
      examcode: examcode,
      examname: exam.examname,   // ✅ store examname
      subjectname,
      subjectcode
    });

    res.json({ success: true, subject });

  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.json({ success: false, message: "Duplicate subject code for this exam" });
    }

    res.json({ success: false, message: "Server error" });
  }
};

exports.update = async (req, res) => {

  try {

    const { subjectname } = req.body;

    await Subject.findByIdAndUpdate(
      req.params.id,
      { subjectname }
    );

    res.json({ success: true });

  } catch (err) {

    console.error("Update error:", err);

    res.json({
      success: false,
      message: err.message
    });

  }

};

exports.delete = async (req, res) => {

  try {

    const subject = await Subject.findById(req.params.id);

    await Subject.findOneAndDelete({
      examcode: subject.examcode,
      subjectcode: subject.subjectcode
    });

    res.json({ success: true });

  } catch (err) {

    console.error("Delete error:", err);

    res.json({
      success: false,
      message: err.message
    });
  }
};