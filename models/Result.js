const mongoose = require("mongoose");

const questionAttemptSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true
  },
  qno: { type: Number },
  question: { type: String, required: true },
  opt1: { type: String },
  opt2: { type: String },
  opt3: { type: String },
  opt4: { type: String },
  correctanswer: { type: Number, required: true },
  useranswer: { type: Number, default: null },

  marks: { type: Number, default: 1 },
  negativemarks: { type: Number, default: 0 },
  iscorrect: { type: Boolean, default: false },
  timetaken: { type: Number, default: 0 } // seconds
});

const ResultSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: { type: String },
  useremail: { type: String },

  examcode: { type: String, required: true },
  examname: { type: String },
  subjectcode: { type: String, required: true },
  subjectname: { type: String },
  unitcode: { type: String },
  unitname: { type: String },
  topiccode: { type: String },
  topicname: { type: String },
  testcode: { type: String },
  difficulty: { type: String, required: true,  enum: ["easy", "hard"] },

  questions: [questionAttemptSchema],
  questionscount: { type: Number },

  attempted: { type: Number, default: 0 },
  right: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },
  positivemarks: { type: Number, default: 0 },
  negativemarks: { type: Number, default: 0 },
  finalscore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },

  teststartedat: { type: Date },
  testendedat: { type: Date },
  duration: { type: Number }, // seconds

  attemptnumber: { type: Number, default: 1 },
  tabswitchcount: { type: Number, default: 0 },
  device: { type: String },
  ipaddress: { type: String },

  topicstats: { type: Array, default: [] },
  unitstats: { type: Array, default: [] }
}, { timestamps: true });



// =============================
// INSTANCE METHODS
// =============================


// Generate test paper code
ResultSchema.methods.getTestPaperCode = function () {

  const parts = [];

  if (this.examcode) parts.push(this.examcode);
  if (this.subjectcode) parts.push(this.subjectcode);
  if (this.unitcode) parts.push(this.unitcode);
  if (this.topiccode) parts.push(this.topiccode);

  return parts.join("_");
};


// Calculate score
ResultSchema.methods.calculateScore = function () {

  let right = 0;
  let wrong = 0;
  let positivemarks = 0;
  let negativemarks = 0;

  this.questions.forEach(q => {
    if (q.useranswer === null || q.useranswer === undefined)
      return;
    if (q.useranswer === q.correctanswer) {
      q.iscorrect = true;
      right++;
      positivemarks += q.marks;
    } else {
      q.iscorrect = false;
      wrong++;
      negativemarks += q.negativemarks;
    }
  });

  this.right = right;
  this.wrong = wrong;
  this.attempted = right + wrong;
  this.skipped = this.questionscount - this.attempted;
  this.positivemarks = positivemarks;
  this.negativemarks = negativemarks;
  this.finalscore = positivemarks - negativemarks;
  this.percentage = this.questionscount
    ? (this.finalscore / this.questionscount) * 100
    : 0;

  this.accuracy = this.attempted
    ? (right / this.attempted) * 100
    : 0;
};

const Result = mongoose.model("Result", ResultSchema);
module.exports = Result;