const Exam = require("../../models/Exam");

exports.list = async (req, res) => {
  const exams = await Exam.find();
  res.render(`pages/${getDevice(req)}/admin/exams`, { exams });
};

exports.showCreate = (req, res) => {
  res.render(`pages/${getDevice(req)}/admin/addExam`);
};

exports.create = async (req, res) => {
  await Exam.create(req.body);
  res.redirect("/admin/exams");
};

exports.showEdit = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  res.render(`pages/${getDevice(req)}/admin/editExam`, { exam });
};

exports.update = async (req, res) => {
  await Exam.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/admin/exams");
};

exports.remove = async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  res.redirect("/admin/exams");
};