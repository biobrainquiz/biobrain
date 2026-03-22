const Exam = require("../../models/Exam");
const getDevice = require("../../utils/getDevice"); // if you use device-based views
const logger = require("../../utils/logger");

// controllers/admin/examController.js
exports.list = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ examname: 1 });
    res.render(`pages/${getDevice(req)}/admin/exams/exam`, { exams });

  } catch (err) {
    logger.error("Error fetching/listing exams:", err);
    res.status(500).send("Unable to fetch/list exams");
  }
};

exports.update = async (req, res) => {
  try {
    await Exam.findByIdAndUpdate(req.params.id, {
      examname: req.body.examname
    });
    res.json({ success: true,message: "exam updated successfully" });

  } catch (err) {
    logger.error("Error updating exam:", err);
    res.json({ success: false, message: "Error updating exam" });
  }
};

exports.delete = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.json({ success: false, message: "Exam not found for deletion" });
    }

    // Delete using examcode so middleware gets it
    await Exam.findOneAndDelete({ examcode: exam.examcode }).orFail();

    res.json({ success: true });

  } catch (err) {
    logger.error("Error deleting exam:", err);
    res.json({ success: false , message: "Error deleting exam"});
  }
};

exports.create = async (req, res) => {
  try {
    let { examname, examcode } = req.body;

    // Basic validation
    if (!examname || !examcode) {
      return res.json({
        success: false,
        message: "Exam name & exam code are required"
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
    logger.error("Failed to create exam:", err);
    return res.json({
      success: false,
      message: "Failed to create exam"
    });
  }
};
