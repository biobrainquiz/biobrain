const aiExplainAnswerService = require("../services/ai/aiExplainAnswerService");
const aiSingleQuizSummaryService = require("../services/ai/aiSingleQuizSummaryService");
const aiAllQuizSummaryService = require("../services/ai/aiAllQuizSummaryService");
const Result = require("../models/Result");
const logger = require("../utils/logger");

exports.aiExplainAnswer = async (req, res) => {
    try {
        const { question, options, correctanswer, useranswer } = req.body;

        // 🛡️ Basic validation
        if (!question || !options || !correctanswer) {
            return res.status(400).json({
                explanation: "Invalid input"
            });
        }

        const explanation = await aiExplainAnswerService.generateAnswerExplanation({
            question,
            options,
            correctanswer,
            useranswer
        });

        res.json({ explanation });

    } catch (err) {
        logger.error("AI Assistant Explain Answer Error:", err);
        res.status(500).json({
            explanation: "⚠️ AI failed. Try again."
        });
    }
};

exports.aiSingleQuizSummary = async (req, res) => {
    try {
        const { resultid } = req.body;
        const result = await Result.findById({_id: resultid}).populate("userid");
        const explanation = await aiSingleQuizSummaryService.generateSingleQuizSummary(result);
        res.json({ explanation });

    } catch (err) {
        logger.error("AI Assistant Single Quiz Summary Error:", err);
        res.status(500).json({
            explanation: "⚠️ AI failed. Try again."
        });
    }
};

exports.aiAllQuizSummary = async (req, res) => {
    try {
        const { userid } = req.body;
        results = await Result.find({
            userid: userid
        }).populate("userid");
        const explanation = await aiAllQuizSummaryService.generateAllQuizSummary(results);
        res.json({ explanation });

    } catch (err) {
        logger.error("AI Assistant All Quiz Summary Error:", err);
        res.status(500).json({
            explanation: "⚠️ AI failed. Try again."
        });
    }
};


