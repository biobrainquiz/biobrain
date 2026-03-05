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
    const exams = await Subject.find().sort({ createdAt: -1 });

    res.render(`pages/${getDevice(req)}/admin/subjects/subject`, {
      exams
    });

  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).send("Unable to fetch exams");
  }
};

/*exports.showCreate = async (req, res) => {
  const exams = await Exam.find();
  res.render(`pages/${getDevice(req)}/admin/addSubject`, { exams });
};

exports.create = async (req, res) => {
  await Subject.create(req.body);
  res.redirect("/admin/subjects");
};

exports.showEdit = async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  const exams = await Exam.find();
  res.render(`pages/${getDevice(req)}/admin/editSubject`, { subject, exams });
};

exports.update = async (req, res) => {
  await Subject.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/admin/subjects");
};

exports.remove = async (req, res) => {
  await Subject.findByIdAndDelete(req.params.id);
  res.redirect("/admin/subjects");
};*/