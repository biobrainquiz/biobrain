const Subject = require("../../models/Subject");
const Exam = require("../../models/Exam");
const getDevice = require("../../utils/getDevice");
const logger = require("../../utils/logger");

exports.list = async (req, res) => {

  try {

    const exams = await Exam.find().sort({ examname: 1 });
    const subjects = await Subject.find()
      .populate("exam")
      .sort({ subjectname: 1 });

    res.render(`pages/${getDevice(req)}/admin/subjects/subject`, {
      exams,
      subjects
    });

  } catch (err) {
    logger.error("Error listing subjects:", err);
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
    logger.error("Error creating subject:", err);

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

    logger.error("Error updating subject:", err);

    res.json({
      success: false,
      message: "Server error"
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

    logger.error("Error deleting subject:", err);

    res.json({
      success: false,
      message: "Server error"
    });
  }
};