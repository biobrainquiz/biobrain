const mongoose = require("mongoose");
const { validateExistence, cascadeDelete } = require("../utils/dbHelpers");

const topicSchema = new mongoose.Schema({
    examcode: { type: String, required: true, uppercase: true, ref: "Exam", trim: true },
    subjectcode: { type: String, required: true, uppercase: true, ref: "Subject", trim: true },
    unitcode: { type: String, required: true, uppercase: true, ref: "Unit", trim: true },
    topiccode: { type: String, required: true, uppercase: true, trim: true },
    topicname: { type: String, required: true, trim: true }
}, { timestamps: true });

// Compound unique index
topicSchema.index({ examcode: 1, subjectcode: 1, unitcode: 1, topiccode: 1 }, { unique: true });

// Pre-save validation
topicSchema.pre("save", async function (next) {
    const Exam = require("./Exam");
    const Subject = require("./Subject");
    const Unit = require("./Unit");

    await validateExistence(Exam, { examcode: this.examcode }, `Exam ${this.examcode} does not exist`);
    await validateExistence(Subject, { examcode: this.examcode, subjectcode: this.subjectcode },
        `Subject ${this.subjectcode} does not exist in Exam ${this.examcode}`);
    await validateExistence(Unit, { examcode: this.examcode, subjectcode: this.subjectcode, unitcode: this.unitcode },
        `Unit ${this.unitcode} does not exist in Subject ${this.subjectcode}`);
    next();
});

// Cascade delete questions
topicSchema.pre("findOneAndDelete", async function (next) {
    const filter = this.getFilter();
    const Question = require("./Question");

    await cascadeDelete(Question, {
        examcode: filter.examcode,
        subjectcode: filter.subjectcode,
        unitcode: filter.unitcode,
        topiccode: filter.topiccode
    });
    next();
});

module.exports = mongoose.model("Topic", topicSchema);