const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const ejs = require("ejs");
const aiExplainAnswerService = require("../services/ai/aiAnalysisService");
const pdfDownloaderService = require("../services/pdfDownloaderService");
const logger = require("../utils/logger");

exports.downloadResultPdf = async (req, res) => {
   await pdfDownloaderService.downloadResultPdf(req, res);
};