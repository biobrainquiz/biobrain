const express = require("express");
const router = express.Router();
const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");
const getNextSequence = require("../utils/counter");

// ================= START QUIZ =================

router.post("/start", async (req, res) => {
    try {
        const { numberOfQuestions, difficulty } = req.body;
        const questions = await Question.aggregate([
            { $sample: { size: parseInt(numberOfQuestions) } }
        ]);

        const timeLimit = parseInt(numberOfQuestions);

        res.json({ questions, timeLimit });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});


// ================= SUBMIT QUIZ =================
router.post("/submit", async (req, res) => {
    try {
        const { answers, questions, exam, subject ,difficulty} = req.body;

        let score = 0;
        let correct = 0;
        let wrong = 0;

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
        const attempted = Object.keys(answers).length;

        // ✅ Date & Time
        const now = new Date();
        const examdate = now.toLocaleDateString();
        const examtime = now.toLocaleTimeString();

         // ✅ HERE — Generate auto-increment serial number
        const sno = await getNextSequence("quizResultCounter");

        // ✅ Save to DB
        const newResult = new QuizResult({
            sno,
            examdate,
            examtime,
            username: req.session.user.username,
            exam,
            subject,
            difficulty,
            noq: totalQuestions,
            attempted,
            right: correct,
            wrong,
            score
        });

        await newResult.save();

        // ✅ Render results page
        res.render("pages/desktop/quizresults", {
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
        console.error(err);
        res.status(500).send("Submission error");
    }
});

module.exports = router;