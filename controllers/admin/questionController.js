const Question = require("../../models/Question");
const Exam = require("../../models/Exam");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");

exports.list = async (req, res) => {
  const questions = await Question.find().populate("exam subject unit topic");
  res.render(`pages/${getDevice(req)}/admin/questions`, { questions });
};

exports.showCreate = async (req, res) => {
  const exams = await Exam.find();
  const subjects = await Subject.find();
  const units = await Unit.find();
  const topics = await Topic.find();

  res.render(`pages/${getDevice(req)}/admin/addQuestion`, {
    exams,
    subjects,
    units,
    topics
  });
};

exports.create = async (req, res) => {
  await Question.create(req.body);
  res.redirect("/admin/questions");
};

exports.showEdit = async (req, res) => {
  const question = await Question.findById(req.params.id);
  const exams = await Exam.find();
  const subjects = await Subject.find();
  const units = await Unit.find();
  const topics = await Topic.find();

  res.render(`pages/${getDevice(req)}/admin/editQuestion`, {
    question,
    exams,
    subjects,
    units,
    topics
  });
};

exports.update = async (req, res) => {
  await Question.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/admin/questions");
};

exports.remove = async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.redirect("/admin/questions");
};