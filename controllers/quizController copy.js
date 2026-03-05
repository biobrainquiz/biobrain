const getNextSequence = require("../utils/getNextSequence");
const QuizResult = require("../models/QuizResult");
const getDevice = require("../utils/getDevice");
const mapCodesToNames = require("../utils/mapCodesToNames");
const Question = require("../models/Question");
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

    const username = req.session.user.username;
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

exports.submitQuiz = async (req, res) => {
  try {
    const {
      answers,
      questions,
      examcode,
      subjectcode,
      unitcode,
      topiccode,
      difficulty
    } = req.body;

    let score = 0;
    let correct = 0;
    let wrong = 0;

    // ✅ Evaluate answers
    questions.forEach(q => {
      const userAns = answers[q._id];

      if (userAns) {
        if (userAns == q.answer) {
          score += q.marks;
          correct++;
        } else {
          wrong++;
        }
      }
    });

    const totalQuestions = questions.length;
    const attempted = Object.keys(answers || {}).length;

    // ✅ Date & Time
    const now = new Date();
    const examdate = now.toLocaleDateString();
    const examtime = now.toLocaleTimeString();

    // ✅ Auto-increment serial number
    const sno = await getNextSequence("quizResultCounter");

    // ✅ Save result in DB
    const newResult = new QuizResult({
      sno,
      examdate,
      examtime,
      username: req.session.user.username,
      examcode,
      subjectcode,
      unitcode,
      topiccode,
      difficulty,
      noq: totalQuestions,
      attempted,
      right: correct,
      wrong,
      score
    });

    await newResult.save();

    const device = getDevice(req);

    // ✅ Render result page
    return res.render(`pages/${device}/quizresults`, {
      totalQuestions,
      attempted,
      correct,
      wrong,
      score,
      questions,
      userAnswers: answers,
      user: req.session.user
    });

  } catch (err) {
    console.error("Quiz Submit Error:", err);
    return res.status(500).send("Submission error");
  }
};

exports.createOrder = (req, res) => {
  try {
    const { examcode, subjectcode, unitcode, topiccode, count, difficulty } = req.body;

    // Save quiz config in session
    req.session.quizConfig = {
      examcode,
      subjectcode,
      unitcode,
      topiccode,
      count,
      difficulty
    };

    return res.redirect(
      `/quiz/start/${examcode}/${subjectcode}/${unitcode}/${topiccode}?count=${count}&difficulty=${difficulty}`
    );

  } catch (err) {
    console.error("Create Order Error:", err);
    return res.status(500).send("Unable to create quiz session");
  }
};

exports.startQuiz = async (req, res) => {
  try {
    const { examcode, subjectcode, unitcode, topiccode } = req.params;
    const { count, difficulty } = req.query;

    const questionCount = parseInt(count) || 10;

    // Fetch random questions
    const questions = await Question.aggregate([
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
    ]);

    // Fetch names
    const examName = await getExamName(examcode);
    const subjectName = await getSubjectName(examcode, subjectcode);
    const unitName = await getUnitName(examcode, subjectcode, unitcode);
    const topicName = await getTopicName(examcode, subjectcode, unitcode, topiccode);

    return res.render(
      `pages/${getDevice(req)}/quiz`,
      {
        questions,
        examcode,
        examName,
        subjectcode,
        subjectName,
        unitcode,
        unitName,
        topiccode,
        topicName,
        user: req.session.user,
        count: questionCount,
        difficulty
      }
    );

  } catch (error) {
    console.error("Quiz Start Error:", error);
    return res.status(500).send("Something went wrong");
  }
};