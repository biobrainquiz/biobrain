const mongoose = require("mongoose");
const { validateExistence, cascadeDelete } = require("../utils/dbHelpers");

const subjectSchema = new mongoose.Schema({
    examcode: { type: String, required: true, ref: "Exam", trim: true },
    subjectcode: { type: String, required: true, uppercase: true, trim: true },
    subjectname: { type: String, required: true, trim: true }
}, { timestamps: true });

// Compound unique index
subjectSchema.index({ examcode: 1, subjectcode: 1 }, { unique: true });

// Pre-save validation
subjectSchema.pre("save", async function (next) {
    const Exam = require("./Exam");
    await validateExistence(Exam, { examcode: this.examcode }, `Exam ${this.examcode} does not exist`);
    next();
});

// Cascade delete units, topics, questions
subjectSchema.pre("findOneAndDelete", async function (next) {
    const filter = this.getFilter();
    const Unit = require("./Unit");
    const Topic = require("./Topic");
    const Question = require("./Question");

    await cascadeDelete(Unit, { examcode: filter.examcode, subjectcode: filter.subjectcode });
    await cascadeDelete(Topic, { examcode: filter.examcode, subjectcode: filter.subjectcode });
    await cascadeDelete(Question, { examcode: filter.examcode, subjectcode: filter.subjectcode });

    next();
});

module.exports = mongoose.model("Subject", subjectSchema);