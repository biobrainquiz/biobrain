const puppeteer = require("puppeteer");
const path = require("path");
const ejs = require("ejs");
const Result = require("../models/Result");

exports.downloadResultPdf = async (req, res) => {

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

        const browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox"]
        });

        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: "networkidle0" });

        /* =========================
        Generate PDF
        ========================= */

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true
        });

        await browser.close();

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=biobrain-result-${mocktestid}.pdf`
        );

        res.send(pdfBuffer);

    } catch (err) {

        console.error(err);
        res.status(500).send("PDF generation failed");

    }
};