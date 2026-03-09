const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const QuizResult = require("../../models/QuizResult");
const Payment = require("../../models/Payment"); // if exists
const Exam = require("../../models/Exam");
const getDevice = require("../../utils/getDevice"); // if you use device-based views


// Render topic page
exports.list = async (req, res) => {
  try {
    /*const topics = await Topic.find()
      .populate("exam")
      .populate("subject")
      .populate("unit")
      .lean();*/


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

    res.render(`pages/${getDevice(req)}/admin/topics/topic`,
      {
        exams,
        subjects,
        units,
        topics
      });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Create topic
exports.create = async (req, res) => {
  try {
    const { examId, subId, unitId, examCode, subCode, unitCode, topiccode, topicname } = req.body;
    if (!examId || !subId || !unitId || !topiccode || !topicname) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const existing = await Topic.findOne({ unit: unitId, topiccode });
    if (existing) return res.json({ success: false, message: "Topic code already exists for this unit" });

    console.log({ exam: examId, subject: subId, unit: unitId, examcode: examCode, subjectcode: subCode, unitcode: unitCode, topiccode, topicname });

    const newTopic = await Topic.create({
      exam: examId,
      subject: subId,
      unit: unitId,
      examcode: examCode,
      subjectcode: subCode,
      unitcode: unitCode,
      topiccode,
      topicname
    });

    res.json({ success: true, topic: newTopic });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
};

// Update topic name
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { topicname } = req.body;
    if (!topicname) return res.json({ success: false, message: "Topic name required" });

    await Topic.findByIdAndUpdate(id, { topicname });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
};

// DELETE via POST
exports.delete = async (req, res) => {
  try {
    const { id } = req.body;  // <-- receive topic ID via POST body
    if (!id) return res.json({ success: false, message: "Topic ID required" });

    await Topic.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
};