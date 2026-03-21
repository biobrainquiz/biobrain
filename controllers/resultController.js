const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const path = require("path");
const ejs = require("ejs");
const Result = require("../models/Result");
const aiAssistantService = require("../services/aiAssistantService");

exports.downloadResultPdf = async (req, res) => {
    let browser;

    try {
        const mocktestid = req.params.mocktestid;
        const result = await Result.findById(mocktestid).lean();

        if (!result) {
            return res.status(404).send("Result not found");
        }

        const templatePath = path.join(
            __dirname,
            "../views/pdf/resultReport.ejs"
        );

        const html = await ejs.renderFile(templatePath, { result });

        /* =========================
        Environment-based launcher
        ========================= */

        /*const isProd =
            process.env.PRODUCTION === "true" &&
            process.platform !== "win32";*/

        const isProd = process.env.PRODUCTION === "true";

        if (isProd) {
            // ✅ Render (Linux)
            const puppeteer = require("puppeteer-core");
            const chromium = require("@sparticuz/chromium");

            browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless
            });

        } else {
            // ✅ Local (Windows)
            const puppeteer = require("puppeteer");

            browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });
        }

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "domcontentloaded"
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=biobrain-result-${mocktestid}.pdf`
        );

        return res.send(pdfBuffer);

    } catch (err) {
        console.error("❌ PDF Error:", err);

        if (!res.headersSent) {
            res.status(500).send("PDF generation failed");
        }

    } finally {
        if (browser) {
            await browser.close();
        }
    }
};


exports.downloadResultPdf1 = async (req, res) => {
    let browser; // ✅ single declaration

    try {
        const mocktestid = req.params.mocktestid;

        const result = await Result.findById(mocktestid).lean();

        if (!result) {
            return res.status(404).send("Result not found");
        }

        /* =========================
        Render EJS HTML
        ========================= */

        const templatePath = path.join(
            __dirname,
            "../views/pdf/resultReport.ejs"
        );

        const html = await ejs.renderFile(templatePath, { result });

        /* =========================
        Launch Puppeteer
        ========================= */

        const isProd = process.env.PRODUCTION === "true";

        try {
            browser = await puppeteer.launch({
                headless: true,
                executablePath: isProd
                    ? "/usr/bin/chromium-browser"   // Render (Linux)
                    : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });
        } catch (e) {
            // fallback for Render alternate path
            if (isProd) {
                browser = await puppeteer.launch({
                    headless: true,
                    executablePath: "/usr/bin/chromium",
                    args: ["--no-sandbox", "--disable-setuid-sandbox"]
                });
            } else {
                throw e;
            }
        }

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "domcontentloaded" }); // faster

        /* =========================
        Generate PDF
        ========================= */

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=biobrain-result-${mocktestid}.pdf`
        );

        return res.send(pdfBuffer); // ✅ return to stop execution

    } catch (err) {
        console.error(err);

        if (!res.headersSent) {
            res.status(500).send("PDF generation failed");
        }

    } finally {
        if (browser) { // ✅ prevent crash
            await browser.close();
        }
    }
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
        console.error("AI Controller Error:", err);

        res.status(500).json({
            explanation: "⚠️ AI failed. Try again."
        });
    }
};