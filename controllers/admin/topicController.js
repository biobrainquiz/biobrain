const Topic = require("../../models/Topic");
const Exam = require("../../models/Exam");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");

exports.list = async (req, res) => {
  const topics = await Topic.find().populate("exam subject unit");
  res.render(`pages/${getDevice(req)}/admin/topics`, { topics });
};

exports.showCreate = async (req, res) => {
  const exams = await Exam.find();
  const subjects = await Subject.find();
  const units = await Unit.find();
  res.render(`pages/${getDevice(req)}/admin/addTopic`, { exams, subjects, units });
};

exports.create = async (req, res) => {
  await Topic.create(req.body);
  res.redirect("/admin/topics");
};

exports.showEdit = async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  const exams = await Exam.find();
  const subjects = await Subject.find();
  const units = await Unit.find();
  res.render(`pages/${getDevice(req)}/admin/editTopic`, {
    topic,
    exams,
    subjects,
    units
  });
};

exports.update = async (req, res) => {
  await Topic.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/admin/topics");
};

exports.remove = async (req, res) => {
  await Topic.findByIdAndDelete(req.params.id);
  res.redirect("/admin/topics");
};