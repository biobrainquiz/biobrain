const Subject = require("../../models/Subject");
const Exam = require("../../models/Exam");

exports.list = async (req, res) => {
  const subjects = await Subject.find().populate("exam");
  res.render(`pages/${getDevice(req)}/admin/subjects`, { subjects });
};

exports.showCreate = async (req, res) => {
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
};