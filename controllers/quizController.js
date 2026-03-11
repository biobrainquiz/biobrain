const ExamSession = require("../services/ExamSession");
const getNextSequence = require("../utils/getNextSequence");
const getDevice = require("../utils/getDevice");
const mapCodesToNames = require("../utils/mapCodesToNames");
const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");
const Attempt = require("../models/Attempt");

const {
  getExamName,
  getSubjectName,
  getUnitName,
  getTopicName
} = require("../utils/getNameByCode");


exports.prepareQuiz = async (req, res) => {
  const device = getDevice(req);

  try {
    const { examcode, subjectcode } = req.params;

    const username = req.session?.user?.username;
    const page = parseInt(req.query.page) || 1;

    const pageLimit = 5;      // table records per page
    const resultsLimit = 50;  // max results for graph

    /* ==========================
       PAGINATED TABLE DATA
    =========================== */

    const totalResults = await QuizResult.countDocuments({
      username,
      examcode,
      subjectcode
    });

    let quizResults = await QuizResult.find({
      username,
      examcode,
      subjectcode
    })
      .sort({ createdAt: 1 })
      .skip((page - 1) * pageLimit)
      .limit(pageLimit)
      .lean();

    // Calculate accuracy
    quizResults.forEach(q => {
      q.accuracy = ((q.right / q.noq) * 100).toFixed(2);
    });

    // Convert codes → names
    quizResults = await mapCodesToNames(quizResults);

    const totalPages = Math.ceil(
      Math.min(totalResults, resultsLimit) / pageLimit
    );

    /* ==========================
       FULL DATA FOR GRAPH
    =========================== */

    const allResults = await QuizResult.find({
      username,
      examcode,
      subjectcode
    }).sort({ createdAt: 1 });

    allResults.forEach(q => {
      q.accuracy = ((q.right / q.noq) * 100).toFixed(2);
    });

    return res.render(`pages/${device}/startquiz`, {
      examcode,
      subjectcode,
      quizResults,
      currentPage: page,
      totalPages,
      allResults
    });

  } catch (err) {
    console.error("Prepare Quiz Error:", err);

    return res.render(`pages/${device}/startquiz`, {
      examcode: req.params.examcode,
      subjectcode: req.params.subjectcode,
      quizResults: [],
      currentPage: 1,
      totalPages: 1,
      allResults: []
    });
  }
};


// PURIFIED
exports.createOrder = async (req, res) => {
  try {
    const { examcode, subjectcode, unitcode, topiccode, count, difficulty } = req.body;
    const questionCount = parseInt(count) || 10;

    const examSessionObj = new ExamSession({ examcode, subjectcode, unitcode, topiccode, count, difficulty });
    examSessionObj.userId = req.session?.user?._id;
    examSessionObj.userName = req.session?.user?.username;
    examSessionObj.exampaperCode = examSessionObj.getExampaperCode();
    examSessionObj.examName = await getExamName(examcode);
    examSessionObj.subjectName = await getSubjectName(examcode, subjectcode);
    examSessionObj.unitName = await getUnitName(examcode, subjectcode, unitcode);
    examSessionObj.topicName = await getTopicName(examcode, subjectcode, unitcode, topiccode);

    // Fetch random questions
    const questions = await GetRandomQuestions(examSessionObj.userId, examSessionObj.exampaperCode, examSessionObj.examCode, examSessionObj.subjectCode, examSessionObj.unitCode, examSessionObj.topicCode, examSessionObj.difficulty, examSessionObj.questionsCount);

    /*const questions = await Question.aggregate([
      {
        $match: {
          examcode,
          subjectcode,
          unitcode,
          topiccode,
          difficulty_level: difficulty
        }
      },
      { $sample: { size: questionCount } }
    ]);*/

    examSessionObj.questions = questions;
    examSessionObj.startedAt = new Date();

    return res.render(
      `pages/${getDevice(req)}/quiz`,
      {
        examSession: examSessionObj
      });
  } catch (err) {
    console.error("Create Order Error:", err);
    return res.status(500).send("Unable to create quiz session");
  }
};

// PURIFIED
exports.submitQuiz = async (req, res) => {
  try {
    const { examSession } = req.body;

    const examSessionObj = new ExamSession();

    examSessionObj.examCode = examSession.examCode;
    examSessionObj.subjectCode = examSession.subjectCode;
    examSessionObj.unitCode = examSession.unitCode;
    examSessionObj.topicCode = examSession.topicCode;
    examSessionObj.questionsCount = examSession.questionsCount;
    examSessionObj.difficulty = examSession.difficulty;

    examSessionObj.userId = examSession.userId;
    examSessionObj.userName = examSession.userName;
    examSessionObj.exampaperCode = examSession.exampaperCode;
    examSessionObj.examName = examSession.examName;
    examSessionObj.subjectName = examSession.subjectName;
    examSessionObj.unitName = examSession.unitName;
    examSessionObj.topicName = examSession.topicName;

    const now1 = new Date();
    examSessionObj.examStartedAt = examSession.examStartedAt; // e.g., "2026-03-08T12:18:07.123Z"
    examSessionObj.examEndedAt = now1.toISOString(); // e.g., "2026-03-08T12:18:07.123Z"
    examSessionObj.duration = (new Date() - new Date(examSessionObj.examStartedAt)) / 1000;

    // questions & answers
    examSessionObj.questions = examSession.questions; // array of {questionId, text, options, selectedOption, correctOption, isCorrect, timeTaken}
    examSessionObj.attemptNumber = 1;
    examSessionObj.answers = examSession.answers; // { questionId: selectedOption }

    // results computation
    examSessionObj.attempted = 0;
    examSessionObj.right = 0;
    examSessionObj.wrong = 0;
    examSessionObj.skipped = 0;
    examSessionObj.positiveMarks = 0;
    examSessionObj.negativeMarks = 0;
    examSessionObj.finalScore = 0;
    examSessionObj.percentage = 0;
    examSessionObj.accuracy = 0;
    examSessionObj.calculateScore();

    // ✅ Auto-increment serial number
    const sno = await getNextSequence("quizResultCounter");
    // ✅ Save result in DB
    const newResult = new QuizResult({
      sno,
      examdate: examSessionObj.examStartedAt,
      examtime: examSessionObj.examEndedAt,
      username: examSessionObj.userName,
      examcode: examSessionObj.examCode,
      subjectcode: examSessionObj.subjectCode,
      unitcode: examSessionObj.unitCode,
      topiccode: examSessionObj.topicCode,
      difficulty: examSessionObj.difficulty,
      noq: examSessionObj.questionsCount,
      attempted: examSessionObj.attempted,
      right: examSessionObj.right,
      wrong: examSessionObj.wrong,
      score: examSessionObj.finalScore
    });

    await newResult.save();
    await UpdateAttemptedTable(examSessionObj.userId, examSessionObj.exampaperCode, examSessionObj.questions);

    const device = getDevice(req);

    // ✅ Render result page
    return res.render(`pages/${device}/quizresults`, {
      examSession: examSessionObj
    });

  } catch (err) {
    console.error("Quiz Submit Error:", err);
    return res.status(500).send("Submission error");
  }
};

async function UpdateAttemptedTable(userid, exampapercode, questions) {

  // extract question ids
  const attemptedQuestionIds = questions.map(q => q._id);

  // store attempted questions
  await Attempt.updateOne(
    { userid, exampapercode },
    {
      $addToSet: {
        questionids: { $each: attemptedQuestionIds }
      }
    },
    { upsert: true }
  );
}

async function GetRandomQuestions(userid, exampapercode, examcode, subjectcode, unitcode, topiccode, difficulty, questioncount) {

  // get attempted question ids
  const attempt = await Attempt.findOne({ userid, exampapercode });

  const attemptedIds = attempt ? attempt.questionids : [];

  const qescount = parseInt(questioncount, 10);
  let questions = await Question.aggregate([
    {
      $match: {
        examcode,
        subjectcode,
        unitcode,
        topiccode,
        difficulty_level: difficulty,
        _id: { $nin: attemptedIds }
      }
    },
    { $sample: { size: qescount } }
  ]);

  // fallback if not enough questions
  if (questions.length < qescount) {

    const moreQuestions = await Question.aggregate([
      {
        $match: {
          examcode,
          subjectcode,
          unitcode,
          topiccode,
          difficulty_level: difficulty
        }
      },
      { $sample: { size: qescount - questions.length } }
    ]);

    questions = [...questions, ...moreQuestions];
  }
  return questions;
}