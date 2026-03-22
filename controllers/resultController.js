const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const ejs = require("ejs");
const aiAssistantService = require("../services/aiAssistantService");
const pdfDownloaderService = require("../services/pdfDownloaderService");
const logger = require("../utils/logger");

exports.downloadResultPdf = async (req, res) => {
   await pdfDownloaderService.downloadResultPdf(req, res);
};

exports.aiAssistantExplainAnswer = async (req, res) => {
    try {
        const { question, options, correctanswer, useranswer } = req.body;

        // 🛡️ Basic validation
        if (!question || !options || !correctanswer) {
            return res.status(400).json({
                explanation: "Invalid input"
            });
        }

        const explanation = await aiAssistantService.generateExplanation({
            question,
            options,
            correctanswer,
            useranswer
        });

        res.json({ explanation });

    } catch (err) {
        logger.error(  "AI Assistant Explain Answer Error:", err);
        res.status(500).json({
            explanation: "⚠️ AI failed. Try again."
        });
    }   
};