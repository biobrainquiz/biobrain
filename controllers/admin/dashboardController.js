const getDevice = require('../../utils/getDevice');

const User = require("../../models/User");
const Exam = require("../../models/Exam");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const QuizResult = require("../../models/QuizResult");
const Payment = require("../../models/Payment"); // if exists

exports.index = async (req, res) => {
    try {
        const device = getDevice(req);
        const uname = req.session?.user?.username || "Admin";

        const dashdata=[
            username,
            examCount,
            subjectCount,
            unitCount,
            topicCount,
            questionCount,
            userCount,


            recentExams,
            recentSubjects,
            recentUnits,
            recentTopics,
            recentQuestions,

            recentResults,
            recentUsers,
            recentPayments
        ] = await Promise.all([
            uname,
            Exam.countDocuments(),
            Subject.countDocuments(),
            Unit.countDocuments(),
            Topic.countDocuments(),
            Question.countDocuments(),
            User.countDocuments(),

                
            Exam.find().sort({ createdAt: -1 }).limit(5),
            Subject.find().sort({ createdAt: -1 }).limit(5),
            Unit.find().sort({ createdAt: -1 }).limit(5),
            Topic.find().sort({ createdAt: -1 }).limit(5),
            Question.find().sort({ createdAt: -1 }).limit(5),
            
            QuizResult.find()
                .sort({ createdAt: -1 })
                .limit(5),
            User.find().sort({ createdAt: -1 }).limit(5),
            Payment ? Payment.find().populate("user").sort({ createdAt: -1 }).limit(5) : []
            
        ]);
        console.log(dashdata);
        res.render(`pages/${device}/admin/dashboard`, {dashdata});

        /*res.render(`pages/${device}/admin/dashboard`, {
            username,
            examCount,
            subjectCount,
            unitCount,
            topicCount,
            questionCount,
            userCount,


            recentExams,
            recentSubjects,
            recentUnits,
            recentTopics,
            recentQuestions,

            recentResults,
            recentUsers,
            recentPayments
        });*/
    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).send("Dashboard error");
    }
};