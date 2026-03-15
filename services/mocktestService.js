const PrepareTest = require("../core/PrepareTest");
const ExamSession = require("./ExamSession");

const Result = require("../models/Result");
const Question = require("../models/Question");
//const QuizResult = require("../models/QuizResult");
const Attempt = require("../models/Attempt");

const logger = require("../utils/logger");
const getNextSequence = require("../utils/getNextSequence");

const {
  getExamName,
  getSubjectName,
  getUnitName,
  getTopicName
} = require("../utils/getNameByCode");


exports.init = async (req, res) => {
  try {

    const { examcode, subjectcode } = req.params;
    const username = req.session?.user?.username;
    const pageno = parseInt(req.query.pageno) || 1;

    const { pageresult, totalpages } =
      await getResultsForPaging(username, examcode, subjectcode, pageno);

    const resultsforgraph =
      await getResultsForGraph(username, examcode, subjectcode);

    const prepareTestObj = new PrepareTest({
      examcode,
      subjectcode,
      pageresult,
      pageno,
      totalpages,
      resultsforgraph
    });
    return prepareTestObj;

  } catch (err) {

    logger.error("Prepare Quiz Error:", err);

    const prepareTestObj = new PrepareTest({
      examcode,
      subjectcode,
      pageresult: [],
      pageno: 1,
      totalpages: 1,
      resultsforgraph: []
    });

    return prepareTestObj;
  }
};

async function getResultsForPaging(username, examcode, subjectcode, pageno) {
  const pagelimit = 5;      // no.of records per page

  let resultcount = await Result.countDocuments({
    username,
    examcode,
    subjectcode
  });

  const totalpages = Math.ceil(resultcount / pagelimit);

  pageresult = await Result.find({
    username,
    examcode,
    subjectcode
  }).sort({ createdat: -1 })
    .skip((pageno - 1) * pagelimit)
    .limit(pagelimit)
    .lean();

  return { pageresult, totalpages };
}

async function getResultsForGraph(username, examcode, subjectcode) {
  const resultsForGraph = await Result.find({
    username,
    examcode,
    subjectcode
  }).sort({ createdat: 1 });

  return resultsForGraph;
}

exports.createOrder = async (req, res) => {
  try {
    const { examcode, subjectcode, unitcode, topiccode, count, difficulty } = req.body;
    const questionCount = parseInt(count) || 10;

    const examSessionObj = new ExamSession({ examcode, subjectcode, unitcode, topiccode, count, difficulty });
    examSessionObj.userid = req.session?.user?._id;
    examSessionObj.username = req.session?.user?.username;
    examSessionObj.exampapercode = examSessionObj.getExampaperCode();
    examSessionObj.examname = await getExamName(examcode);
    examSessionObj.subjectname = await getSubjectName(examcode, subjectcode);
    examSessionObj.unitname = await getUnitName(examcode, subjectcode, unitcode);
    examSessionObj.topicname = await getTopicName(examcode, subjectcode, unitcode, topiccode);
    examSessionObj.difficulty = difficulty;

    // 1️⃣ Capture client IP
    const ipaddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
      .split(',')[0]
      .trim();

    // 2️⃣ Capture device/browser info
    const UAParser = require('ua-parser-js');
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();
    const device = `${result.os.name || 'Unknown OS'} ${result.os.version || ''} / ${result.browser.name || 'Unknown Browser'} ${result.browser.version || ''}`;

    // 3️⃣ Save into examSessionObj
    examSessionObj.ipaddress = ipaddress;
    examSessionObj.device = device;

    // Fetch random questions
    const questions = await GetRandomQuestions(examSessionObj.userid, examSessionObj.exampapercode, examSessionObj.examcode, examSessionObj.subjectcode, examSessionObj.unitcode, examSessionObj.topiccode, examSessionObj.difficulty, examSessionObj.questionscount);
    examSessionObj.questions = questions;
    examSessionObj.startedat = new Date();
    return examSessionObj;

  } catch (err) {
    console.error("Create Order Error:", err);
    return null;
  }
};

async function GetRandomQuestions(userid, exampapercode, examcode, subjectcode, unitcode, topiccode, difficulty, questioncount) {

  // get attempted question ids
  const attempt = await Attempt.findOne({ userid, exampapercode });

  const attemptedids = attempt ? attempt.questionids : [];

  const qescount = parseInt(questioncount, 10);
  let questions = await Question.aggregate([
    {
      $match: {
        examcode,
        subjectcode,
        unitcode,
        topiccode,
        difficulty_level: difficulty,
        _id: { $nin: attemptedids }
      }
    },
    { $sample: { size: qescount } }
  ]);

  // fallback if not enough questions
  if (questions.length < qescount) {

    const morequestions = await Question.aggregate([
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

    questions = [...questions, ...morequestions];
  }
  return questions;
}

exports.submit = async (req, res) => {
  try {
    const { examSession } = req.body;

    const examSessionObj = new ExamSession();

    examSessionObj.examcode = examSession.examcode;
    examSessionObj.subjectcode = examSession.subjectcode;
    examSessionObj.unitcode = examSession.unitcode;
    examSessionObj.topiccode = examSession.topiccode;
    examSessionObj.questionscount = examSession.questionscount;
    examSessionObj.difficulty = examSession.difficulty;

    examSessionObj.userid = examSession.userid;
    examSessionObj.username = examSession.username;
    examSessionObj.useremail = req.session.user?.email;
    examSessionObj.exampapercode = examSession.exampapercode;
    examSessionObj.examname = examSession.examname;
    examSessionObj.subjectname = examSession.subjectname;
    examSessionObj.unitname = examSession.unitname;
    examSessionObj.topicname = examSession.topicname;

    examSessionObj.ipaddress = examSession.ipaddress;
    examSessionObj.device = examSession.device;

    const now1 = new Date();
    examSessionObj.examstartedat = examSession.examstartedat; // e.g., "2026-03-08T12:18:07.123Z"
    examSessionObj.examendedat = now1.toISOString(); // e.g., "2026-03-08T12:18:07.123Z"
    examSessionObj.duration = (new Date() - new Date(examSessionObj.examstartedat)) / 1000;

    // questions & answers
    examSessionObj.questions = examSession.questions; // array of {questionId, text, options, selectedOption, correctOption, isCorrect, timeTaken}
    examSessionObj.attemptnumber = 1;
    examSessionObj.answers = examSession.answers; // { questionId: selectedOption }

    // results computation
    examSessionObj.attempted = 0;
    examSessionObj.right = 0;
    examSessionObj.wrong = 0;
    examSessionObj.skipped = 0;
    examSessionObj.positivemarks = 0;
    examSessionObj.negativemarks = 0;
    examSessionObj.finalscore = 0;
    examSessionObj.percentage = 0;
    examSessionObj.accuracy = 0;
    examSessionObj.calculateScore();

    // ✅ Auto-increment serial number
    const sno = await getNextSequence("quizResultCounter");

    await SaveResult(examSessionObj)

    // ✅ Save result in DB
    /*const newResult = new QuizResult({
      sno,
      examdate: examSessionObj.examstartedat,
      examtime: examSessionObj.examendedat,
      username: examSessionObj.username,
      examcode: examSessionObj.examcode,
      subjectcode: examSessionObj.subjectcode,
      unitcode: examSessionObj.unitcode,
      topiccode: examSessionObj.topiccode,
      difficulty: examSessionObj.difficulty,
      noq: examSessionObj.questionscount,
      attempted: examSessionObj.attempted,
      right: examSessionObj.right,
      wrong: examSessionObj.wrong,
      score: examSessionObj.finalscore
    });
    await newResult.save();*/

    await UpdateAttemptedTable(examSessionObj.userid, examSessionObj.exampapercode, examSessionObj.questions);
    return examSessionObj;
  } catch (err) {
    console.error("Quiz Submit Error:", err);
    return null;
  }
};

async function UpdateAttemptedTable(userid, exampapercode, questions) {

  // extract question ids
  const attemptedquestionids = questions.map(q => q._id);

  // store attempted questions
  await Attempt.updateOne(
    { userid, exampapercode },
    {
      $addToSet: {
        questionids: { $each: attemptedquestionids }
      }
    },
    { upsert: true }
  );
}

async function SaveResult(examSessionObj) {

  const answers = examSessionObj.answers || {};

  const resultQuestions = examSessionObj.questions.map(q => {
    const useranswer = answers[q._id.toString()] ?? -1;
    return {
      _id: q._id,
      qno: q.qno,

      question: q.question,

      opt1: q.opt1,
      opt2: q.opt2,
      opt3: q.opt3,
      opt4: q.opt4,

      correctanswer: q.answer,

      useranswer,

      marks: q.marks || 1,
      negativemarks: q.negativemarks || 0,

      iscorrect: useranswer === q.answer,

      timetaken: q.timetaken || 0
    };
  });

  // ✅ Save result in DB
  const result = new Result({
    questions: resultQuestions,
    questionscount: resultQuestions.length,

    userid: examSessionObj.userid,
    username: examSessionObj.username,
    useremail: examSessionObj.useremail,
    examcode: examSessionObj.examcode,
    examname: examSessionObj.examname,
    subjectcode: examSessionObj.subjectcode,
    subjectname: examSessionObj.subjectname,
    unitcode: examSessionObj.unitcode,
    unitname: examSessionObj.unitname,
    topiccode: examSessionObj.topiccode,
    topicname: examSessionObj.topicname,
    testcode: examSessionObj.exampapercode,
    difficulty: examSessionObj.difficulty,
    attempted: examSessionObj.attempted,
    right: examSessionObj.right,
    wrong: examSessionObj.wrong,
    skipped: examSessionObj.skipped,
    positivemarks: examSessionObj.positivemarks,
    negativemarks: examSessionObj.negativemarks,
    finalccore: examSessionObj.finalscore,
    percentage: examSessionObj.percentage,
    accuracy: examSessionObj.accuracy,

    testStartedAt: examSessionObj.examstartedat,
    testEndedAt: examSessionObj.examendedat,
    duration: examSessionObj.duration,

    attemptnumber: examSessionObj.attemptnumber,
    tabswitchcount: examSessionObj.tabswitchcount,
    device: examSessionObj.device,
    ipaddress: examSessionObj.ipaddress,
    topicstats: examSessionObj.topicstats,
    unitstats: examSessionObj.unitstats,
  });
  await result.save();
}