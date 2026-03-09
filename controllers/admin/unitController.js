const Unit = require("../../models/Unit");
const Exam = require("../../models/Exam");
const Subject = require("../../models/Subject");
const getDevice = require("../../utils/getDevice"); // if you use device-based views

/* ======================================================
   LIST UNITS PAGE
====================================================== */

exports.list = async (req, res) => {

    try {

        const exams = await Exam.find().sort({ examname: 1 });

        const subjects = await Subject.find().populate("exam").sort({ subjectname: 1 });

        const units = await Unit.find()
            .populate("exam")
            .populate("subject")
            .sort({ unitname: 1 });

        res.render(`pages/${getDevice(req)}/admin/units/unit`, {
            exams,
            subjects,
            units
        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Error loading units");

    }

};


/* ======================================================
   CREATE UNIT
====================================================== */

exports.create = async (req, res) => {
    try {

        const { examCode, subjectCode, unitcode, unitname, examId, subjectId } = req.body;
        const exam = await Exam.findById(examId);
        const subject = await Subject.findById(subjectId);

        if (!exam || !subject) {
            return res.status(400).json({ error: "Invalid exam or subject" });
        }

        const newUnit = await Unit.create({

            exam: exam._id,
            subject: subject._id,

            examcode: exam.examcode,
            subjectcode: subject.subjectcode,

            unitname,
            unitcode

        });

        return res.json({
            success: true,
            message: "Unit created successfully!"
        });

    } catch (err) {

        console.error(err);
        res.status(500).json({ error: "Error creating unit" });
    }
};


/* ======================================================
   UPDATE UNIT
====================================================== */



exports.update = async (req, res) => {
    try {
        await Unit.findByIdAndUpdate(req.params.id, {
            unitname: req.body.unitname
        });
        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
};


/* ======================================================
   DELETE UNIT
====================================================== */

/*exports.delete = async (req, res) => {

    try {

        await Unit.findOneAndDelete({ _id: req.params.id });

        res.json({ success: true });

    } catch (err) {

        console.error(err);
        res.status(500).json({ error: "Delete failed" });

    }

};*/

exports.delete = async (req, res) => {

    try {

        const unit = await Unit.findById({ _id: req.params.id });

        await Unit.findOneAndDelete({
            examcode: unit.examcode,
            subjectcode: unit.subjectcode,
            unitcode: unit.unitcode
        });

        res.json({ success: true });

    } catch (err) {

        console.error("Delete error:", err);

        res.json({
            success: false,
            message: err.message
        });
    }
};

/* ======================================================
   API: GET SUBJECTS BY EXAM
====================================================== */

exports.getSubjectsByExam = async (req, res) => {

    try {

        const subjects = await Subject.find({
            examcode: req.params.examcode
        }).sort({ subjectname: 1 });

        res.json(subjects);

    } catch (err) {

        console.error(err);
        res.status(500).json({ error: "Cannot load subjects" });

    }

};