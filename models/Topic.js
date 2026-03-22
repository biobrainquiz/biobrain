const mongoose = require("mongoose");
const { validateExistence, cascadeDelete } = require("../utils/dbHelpers");
const logger = require("../utils/logger");

const topicSchema = new mongoose.Schema(
  {
    examcode: { type: String, required: true, uppercase: true, trim: true },
    subjectcode: { type: String, required: true, uppercase: true, trim: true },
    unitcode: { type: String, required: true, uppercase: true, trim: true },

    topiccode: { type: String, required: true, uppercase: true, trim: true },
    topicname: { type: String, required: true, trim: true },

    // References for population
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },
  },
  { timestamps: true }
);

// Compound unique index: topiccode must be unique per unit/subject/exam
topicSchema.index(
  { examcode: 1, subjectcode: 1, unitcode: 1, topiccode: 1 },
  { unique: true }
);

/**
 * Pre-save hook: Validate existence of Exam, Subject, and Unit
 */
topicSchema.pre("save", async function () {
  try {
    const Exam = require("./Exam");
    const Subject = require("./Subject");
    const Unit = require("./Unit");

    await validateExistence(
      Exam,
      { examcode: this.examcode },
      `Exam ${this.examcode} does not exist`
    );

    await validateExistence(
      Subject,
      { examcode: this.examcode, subjectcode: this.subjectcode },
      `Subject ${this.subjectcode} does not exist in Exam ${this.examcode}`
    );

    await validateExistence(
      Unit,
      { examcode: this.examcode, subjectcode: this.subjectcode, unitcode: this.unitcode },
      `Unit ${this.unitcode} does not exist in Subject ${this.subjectcode}`
    );
  } catch (err) {
    logger.error("Topic pre-save validation failed:", err.message);
    throw err;
  }
});

/**
 * Pre findOneAndDelete hook: Cascade delete related Questions
 */
topicSchema.pre("findOneAndDelete", async function () {
  try {
    const filter = this.getFilter();
    const Question = require("./Question");

    // Fetch the document to get codes
    const doc = await this.model.findOne(filter).lean();
    if (doc) {
      await cascadeDelete(Question, {
        examcode: doc.examcode,
        subjectcode: doc.subjectcode,
        unitcode: doc.unitcode,
        topiccode: doc.topiccode,
      });
    }
  } catch (err) {
    logger.error("Error in cascade delete for topic:", err);
  }
});

module.exports = mongoose.model("Topic", topicSchema);