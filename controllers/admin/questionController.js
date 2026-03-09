const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const QuizResult = require("../../models/QuizResult");
const Exam = require("../../models/Exam");
const Payment = require("../../models/Payment"); // if exists
const getDevice = require("../../utils/getDevice"); // if you use device-based views


// ================= LIST =================

exports.list = async (req, res) => {

  try {

    const exams = await Exam.find().sort({ examname: 1 });
    const subjects = await Subject.find().populate("exam").sort({ subjectname: 1 });
    const units = await Unit.find()
      .populate("exam")
      .populate("subject")
      .sort({ unitname: 1});
    const topics = await Topic.find()
      .populate("exam")
      .populate("subject")
      .populate("unit")
      .sort({ topicname: 1 });

    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    const questions = await Question
      .find()
      .populate("exam")
      .populate("subject")
      .populate("unit")
      .populate("topic")
      .skip(skip)
      .limit(limit)
      .sort({ qno: 1 });

    const total = await Question.countDocuments();
    const pages = Math.ceil(total / limit);

    res.render(`pages/${getDevice(req)}/admin/questions/question`, {
      exams,
      subjects,
      units,
      topics,
      questions,
      pagination: {
        page,
        pages,
        prev: page > 1 ? page - 1 : null,
        next: page < pages ? page + 1 : null
      }

    });

  } catch (err) {

    console.error(err);
    res.status(500).send("Server Error");

  }

};



// ================= CREATE =================

exports.create = async (req, res) => {

  try {

    await Question.create(req.body);

    res.redirect("/questions");

  } catch (err) {

    console.error(err);
    res.status(500).send("Insert failed");

  }

};



// ================= UPDATE =================

exports.update = async (req, res) => {

  try {

    const id = req.params.id;

    await Question.findByIdAndUpdate(id, req.body);

    res.redirect("/questions");

  } catch (err) {

    console.error(err);
    res.status(500).send("Update failed");

  }

};



// ================= DELETE =================

exports.delete = async (req, res) => {

  try {

    const id = req.body.id;

    await Question.findByIdAndDelete(id);

    res.redirect("/questions");

  } catch (err) {

    console.error(err);
    res.status(500).send("Delete failed");

  }

};