const mongoose = require("mongoose");

// =============================
// QUESTION ATTEMPT SUBDOCUMENT
// =============================

const questionAttemptSchema = new mongoose.Schema({

  // Reference to original question
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true
  },

  qno: { type: Number },

  // Snapshot of question
  question: { type: String, required: true },

  opt1: { type: String },
  opt2: { type: String },
  opt3: { type: String },
  opt4: { type: String },

  correctAnswer: { type: Number, required: true },

  // User answer
  userAnswer: { type: Number, default: null },

  // Marks
  marks: { type: Number, default: 1 },

  negativeMarks: { type: Number, default: 0 },

  // Result
  isCorrect: { type: Boolean, default: false },

  // Analytics
  timeTaken: { type: Number, default: 0 } // seconds

});


// =============================
// EXAM RESULT SCHEMA
// =============================

const ResultSchema = new mongoose.Schema({

  // =========================
  // USER INFO
  // =========================

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  userName: { type: String },

  userEmail: { type: String },


  // =========================
  // EXAM INFO
  // =========================

  examCode: { type: String, required: true },

  examName: { type: String },

  subjectCode: { type: String, required: true },

  subjectName: { type: String },

  unitCode: { type: String },

  unitName: { type: String },

  topicCode: { type: String },

  topicName: { type: String },

  testCode: { type: String },


  // =========================
  // QUESTIONS
  // =========================

  questions: [questionAttemptSchema],

  questionsCount: { type: Number },


  // =========================
  // RESULT SUMMARY
  // =========================

  attempted: { type: Number, default: 0 },

  right: { type: Number, default: 0 },

  wrong: { type: Number, default: 0 },

  skipped: { type: Number, default: 0 },

  positiveMarks: { type: Number, default: 0 },

  negativeMarks: { type: Number, default: 0 },

  finalScore: { type: Number, default: 0 },

  percentage: { type: Number, default: 0 },

  accuracy: { type: Number, default: 0 },


  // =========================
  // TIMING
  // =========================

  testStartedAt: { type: Date },

  testEndedAt: { type: Date },

  duration: { type: Number }, // seconds


  // =========================
  // ATTEMPT INFO
  // =========================

  attemptNumber: { type: Number, default: 1 },


  // =========================
  // ANALYTICS
  // =========================

  tabSwitchCount: { type: Number, default: 0 },

  device: { type: String },

  ipAddress: { type: String },


  // =========================
  // PERFORMANCE BREAKDOWN
  // =========================

  topicStats: { type: Array, default: [] },

  unitStats: { type: Array, default: [] }

}, { timestamps: true });



// =============================
// INSTANCE METHODS
// =============================


// Generate test paper code
ResultSchema.methods.getTestPaperCode = function () {

  const parts = [];

  if (this.examCode) parts.push(this.examCode);
  if (this.subjectCode) parts.push(this.subjectCode);
  if (this.unitCode) parts.push(this.unitCode);
  if (this.topicCode) parts.push(this.topicCode);

  return parts.join("_");
};


// Calculate score
ResultSchema.methods.calculateScore = function () {

  let right = 0;
  let wrong = 0;
  let positiveMarks = 0;
  let negativeMarks = 0;

  this.questions.forEach(q => {

    if (q.userAnswer === null || q.userAnswer === undefined)
      return;

    if (q.userAnswer === q.correctAnswer) {

      q.isCorrect = true;

      right++;

      positiveMarks += q.marks;

    } else {

      q.isCorrect = false;

      wrong++;

      negativeMarks += q.negativeMarks;
    }

  });

  this.right = right;
  this.wrong = wrong;

  this.attempted = right + wrong;

  this.skipped = this.questionsCount - this.attempted;

  this.positiveMarks = positiveMarks;

  this.negativeMarks = negativeMarks;

  this.finalScore = positiveMarks - negativeMarks;

  this.percentage = this.questionsCount
    ? (this.finalScore / this.questionsCount) * 100
    : 0;

  this.accuracy = this.attempted
    ? (right / this.attempted) * 100
    : 0;

};



// =============================
// MODEL
// =============================

const Result = mongoose.model("Result", ResultSchema);

module.exports = Result;