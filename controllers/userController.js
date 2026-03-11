const User = require("../models/User");
const QuizResult = require("../models/QuizResult");
const getDevice = require("../utils/getDevice");


// ==========================
// PROFILE PAGE
// ==========================
exports.getProfile = async (req, res) => {
    try {
        const uname = req.session.user.username;

        // 🔹 Get User Details
        const user = await User.findOne({ username: uname }).lean();

        if (!user) {
            return res.redirect("/dashboard");
        }

        // 🔹 Aggregate Performance Stats
        const statsData = await QuizResult.aggregate([
            { $match: { username: uname } },
            {
                $group: {
                    _id: "$username",
                    totalQuizzes: { $sum: 1 },
                    totalScore: { $sum: "$score" },
                    averageScore: { $avg: "$score" },
                    highestScore: { $max: "$score" },
                    lowestScore: { $min: "$score" },
                    totalCorrect: { $sum: "$correctAnswers" },
                    totalQuestions: { $sum: "$totalQuestions" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalQuizzes: 1,
                    totalScore: 1,
                    averageScore: { $round: ["$averageScore", 2] },
                    highestScore: 1,
                    lowestScore: 1,
                    overallAccuracy: {
                        $cond: [
                            { $gt: ["$totalQuestions", 0] },
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: ["$totalCorrect", "$totalQuestions"] },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        ]);

        const stats = statsData[0] || {
            totalQuizzes: 0,
            totalScore: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            overallAccuracy: 0
        };

        // 🔹 Quiz History For Chart
        const quizHistory = await QuizResult.find({ username: uname })
            .sort({ createdAt: 1 })
            .select("score createdAt")
            .lean();

        res.render(`pages/${getDevice(req)}/profile`, {
            user,
            stats,
            quizHistory
        });

    } catch (err) {
        console.error("Profile Error:", err);
        res.redirect("/login");
    }
};