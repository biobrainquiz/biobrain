const mongoose = require("mongoose");
const { validateExistence, cascadeDelete } = require("../utils/dbHelpers");

const subjectSchema = new mongoose.Schema({
    examcode: { type: String, required: true, trim: true },

    subjectcode: { type: String, required: true, uppercase: true, trim: true },
    subjectname: { type: String, required: true, trim: true },

    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true }
}, { timestamps: true });


// Unique subject per exam
subjectSchema.index({ examcode: 1, subjectcode: 1 }, { unique: true });


// Pre-save validation
subjectSchema.pre("save", async function () {

    const Exam = require("./Exam");

    await validateExistence(
        Exam,
        { examcode: this.examcode },
        `Exam ${this.examcode} does not exist`
    );

});


// Cascade delete Units, Topics, Questions
subjectSchema.pre("findOneAndDelete", async function () {

    const filter = this.getFilter();

    const Subject = mongoose.model("Subject");
    const subject = await Subject.findOne(filter);

    if (!subject) return;

    const Unit = require("./Unit");
    const Topic = require("./Topic");
    const Question = require("./Question");

    await cascadeDelete(Unit, {
        examcode: subject.examcode,
        subjectcode: subject.subjectcode
    });

    await cascadeDelete(Topic, {
        examcode: subject.examcode,
        subjectcode: subject.subjectcode
    });

    await cascadeDelete(Question, {
        examcode: subject.examcode,
        subjectcode: subject.subjectcode
    });

});

module.exports = mongoose.model("Subject", subjectSchema);