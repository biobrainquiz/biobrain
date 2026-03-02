const Unit = require("../../models/Unit");
const Exam = require("../../models/Exam");
const Subject = require("../../models/Subject");

exports.list = async (req, res) => {
  const units = await Unit.find().populate("exam subject");
  res.render(`pages/${getDevice(req)}/admin/units`, { units });
};

exports.showCreate = async (req, res) => {
  const exams = await Exam.find();
  const subjects = await Subject.find();
  res.render(`pages/${getDevice(req)}/admin/addUnit`, { exams, subjects });
};

exports.create = async (req, res) => {
  await Unit.create(req.body);
  res.redirect("/admin/units");
};

exports.showEdit = async (req, res) => {
  const unit = await Unit.findById(req.params.id);
  const exams = await Exam.find();
  const subjects = await Subject.find();
  res.render(`pages/${getDevice(req)}/admin/editUnit`, { unit, exams, subjects });
};

exports.update = async (req, res) => {
  await Unit.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/admin/units");
};

exports.remove = async (req, res) => {
  await Unit.findByIdAndDelete(req.params.id);
  res.redirect("/admin/units");
};