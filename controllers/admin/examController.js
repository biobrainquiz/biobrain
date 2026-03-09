const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const QuizResult = require("../../models/QuizResult");
const Payment = require("../../models/Payment"); // if exists
const Exam = require("../../models/Exam");
const getDevice = require("../../utils/getDevice"); // if you use device-based views

// controllers/admin/examController.js
exports.list = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ examname: 1 });

    res.render(`pages/${getDevice(req)}/admin/exams/exam`, {
      exams
    });

  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).send("Unable to fetch exams");
  }
};

exports.update = async (req, res) => {
  try {
    await Exam.findByIdAndUpdate(req.params.id, {
      examname: req.body.examname
    });
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
};

exports.delete = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.json({ success: false, message: "Exam not found" });
    }

    // Delete using examcode so middleware gets it
    await Exam.findOneAndDelete({ examcode: exam.examcode }).orFail();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
};

// controllers/admin/examController.js

exports.create = async (req, res) => {
  try {
    let { examname, examcode } = req.body;

    // Basic validation
    if (!examname || !examcode) {
      return res.json({
        success: false,
        message: "Exam name and exam code are required"
      });
    }

    // Clean input
    examname = examname.trim().toUpperCase();
    examcode = examcode.trim().toUpperCase();

    // Check duplicate examcode
    const existingExam = await Exam.findOne({ examcode });

    if (existingExam) {
      return res.json({
        success: false,
        message: "Exam code already exists"
      });
    }

    // Create exam
    const newExam = await Exam.create({
      examname,
      examcode
    });

    return res.json({
      success: true,
      exam: newExam
    });

  } catch (err) {
    console.error("Error creating exam:", err);

    return res.json({
      success: false,
      message: "Failed to create exam"
    });
  }
};
