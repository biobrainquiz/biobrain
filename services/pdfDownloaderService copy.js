const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const path = require("path");
const ejs = require("ejs");
const PDFDocument = require("pdfkit");
const Result = require("../models/Result");

// puppeteer pdf generator
exports.downloadResultPdf1 = async (req, res) => {
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

exports.downloadResultPdf2 = async (req, res) => {
    try {

        const mocktestid = req.params.mocktestid;
        const result = await Result.findById(mocktestid).lean();

        if (!result) {
            return res.status(404).send("Result not found");
        }

        // ===== Create PDF =====
        const doc = new PDFDocument({ size: "A4", margin: 40 });

        // ===== Send PDF as download =====
        res.setHeader("Content-Disposition", "attachment; filename=BioBrain_Full_Report.pdf");
        res.setHeader("Content-Type", "application/pdf");

        // Pipe PDF to response
        doc.pipe(res);

        // ===== Register Fonts =====
        doc.registerFont('Lora-Bold', 'fonts/Lora-Bold.ttf');
        doc.registerFont('Mont-Bold', 'fonts/Montserrat-Bold.ttf');
        doc.registerFont('Mont-Medium', 'fonts/Montserrat-Medium.ttf');
        doc.registerFont('Mont-Regular', 'fonts/Montserrat-Regular.ttf');

        // ===== Helpers =====
        const drawBg = (p) => p.save().rect(0, 0, p.page.width, p.page.height).fill("#f5f7fb").restore();

        const drawSectionTitle = (title, y) => {
            doc.save();
            doc.rect(40, y, 4, 14).fill("#2f80ed");
            doc.font('Lora-Bold').fontSize(11).fillColor("#2c3e50").text(title, 52, y + 1);
            doc.restore();
            return y + 23;
        };

        const drawInfoGrid = (data, startY) => {
            const boxWidth = 250, boxHeight = 22, gap = 6;
            let lastY = startY;
            data.forEach((item, i) => {
                let col = i % 2, row = Math.floor(i / 2);
                let x = 40 + col * (boxWidth + 15), y = startY + row * (boxHeight + gap);
                doc.save();
                doc.roundedRect(x, y, boxWidth, boxHeight, 4).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
                doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(`${item.label}: `, x + 8, y + 6, { continued: true });
                doc.font('Mont-Medium').fillColor("#555").text(item.value);
                doc.restore();
                lastY = y + boxHeight;
            });
            return lastY;
        };

        const drawProgressBar = (label, value, total, color, y) => {
            const percentage = (value / total) * 100;
            doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(label, 40, y);
            doc.roundedRect(40, y + 12, 515, 10, 5).fill("#e5e7eb");
            if (percentage > 0) doc.roundedRect(40, y + 12, (515 * percentage) / 100, 10, 5).fill(color);
            return y + 32;
        };

        const drawStatusIcon = (x, y, type, color) => {
            doc.save();
            doc.circle(x, y, 6).fill(color);
            doc.lineWidth(1.2).strokeColor("white");
            if (type === 'tick') {
                doc.moveTo(x - 3, y).lineTo(x - 1, y + 2).lineTo(x + 3, y - 2).stroke();
            } else {
                doc.moveTo(x - 2, y - 2).lineTo(x + 2, y + 2).moveTo(x + 2, y - 2).lineTo(x - 2, y + 2).stroke();
            }
            doc.restore();
        };

        // ===== Start PDF content =====
        drawBg(doc);

        // HEADER
        doc.save();
        doc.roundedRect(40, 40, 515, 70, 10).fill("#2f80ed");
        doc.font('Lora-Bold').fontSize(22).fillColor("white").text("BioBrain", 60, 55);
        doc.font('Lora-Bold').fontSize(13).text("Performance Analytics Report", 300, 58, { align: "right", width: 230 });
        doc.font('Mont-Regular').fontSize(9).fillColor("#e0e0e0").text(`Generated on ${new Date().toLocaleString()}`, 300, 76, { align: "right", width: 230 });
        doc.restore();

        let currentY = 125;

        // Candidate & Test Info
        currentY = drawSectionTitle("Candidate Information", currentY);
        currentY = drawInfoGrid([
            { label: "Name", value: result.username },
            { label: "User ID", value: result.userid },
            { label: "Email", value: result.useremail },
            { label: "Attempt #", value: result.attemptnumber }
        ], currentY);

        currentY += 22;
        currentY = drawSectionTitle("Test Information", currentY);
        currentY = drawInfoGrid([
            { label: "Exam", value: result.examname },
            { label: "Unit", value: result.unitname },
            { label: "Difficulty", value: result.difficulty },
            { label: "Started", value: result.teststartedat },
            { label: "Subject", value: result.subjectname },
            { label: "Topic", value: result.topicname },
            { label: "Test Code", value: result.testcode },
            { label: "Ended", value: result.testendedat }
        ], currentY);

        // Performance Summary
        currentY += 22;
        currentY = drawSectionTitle("Performance Summary", currentY);
        doc.font('Mont-Bold').fontSize(10).fillColor("#34495e").text("Attempt Statistics", 40, currentY);
        currentY += 18;

        const statsY = currentY;
        let cardX = 40;
        const stats = [
            { val: result.questionscount, label: "Total Questions", color: "#2f80ed" },
            { val: result.attempted, label: "Attempted", color: "#8e44ad" },
            { val: result.right, label: "Correct", color: "#27ae60" },
            { val: result.wrong, label: "Wrong", color: "#e74c3c" },
            { val: result.skipped, label: "Skipped", color: "#95a5a6" }
        ];
        stats.forEach(s => {
            doc.save().roundedRect(cardX, statsY, 95, 65, 8).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
            doc.rect(cardX, statsY, 95, 4).fill(s.color);
            doc.font('Mont-Bold').fontSize(16).fillColor("#2c3e50").text(s.val, cardX, statsY + 18, { align: 'center', width: 95 });
            doc.font('Mont-Medium').fontSize(8.5).fillColor("#555").text(s.label, cardX, statsY + 42, { align: 'center', width: 95 });
            doc.restore();
            cardX += 105;
        });
        currentY = statsY + 80;

        // Score Metrics
        doc.font('Mont-Bold').fontSize(10).fillColor("#34495e").text("Score Metrics", 40, currentY);
        currentY += 18;
        cardX = 40;
        const metrics = [
            { val: `${result.accuracy.toFixed(2)}%`, label: "Accuracy", color: "#27ae60" },
            { val: `${result.percentage.toFixed(2)}%`, label: "Percentage", color: "#f39c12" },
            { val: result.finalscore, label: "Final Score", color: "#2f80ed" }
        ];
        metrics.forEach(m => {
            doc.save().roundedRect(cardX, currentY, 163, 65, 8).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
            doc.rect(cardX, currentY, 163, 4).fill(m.color);
            doc.font('Mont-Bold').fontSize(16).fillColor("#2c3e50").text(m.val, cardX, currentY + 18, { align: 'center', width: 163 });
            doc.font('Mont-Medium').fontSize(8.5).fillColor("#555").text(m.label, cardX, currentY + 42, { align: 'center', width: 163 });
            doc.restore();
            cardX += 175;
        });
        currentY += 80;

        // Performance Breakdown
        currentY += 22;
        currentY = drawSectionTitle("Performance Breakdown", currentY);
        currentY = drawProgressBar("Correct Answers", result.right, result.questionscount, "#27ae60", currentY);
        currentY = drawProgressBar("Wrong Answers", result.wrong, result.questionscount, "#e74c3c", currentY);
        currentY = drawProgressBar("Skipped", result.skipped, result.questionscount, "#2f80ed", currentY);

        // Question-wise analysis
        doc.addPage();
        drawBg(doc);
        let qY = drawSectionTitle("Question Wise Analysis", 40);

        result.questions.forEach((q, i) => {
            if (qY > 620) { doc.addPage(); drawBg(doc); qY = 40; }
            doc.save();
            doc.roundedRect(40, qY, 515, 145, 6).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
            doc.fillColor("#2c3e50").font('Mont-Bold').fontSize(10).text(`Q${i + 1}. ${q.question}`, 55, qY + 12);

            let optY = qY + 35;
            [q.opt1, q.opt2, q.opt3, q.opt4].forEach((opt, j) => {
                const optNum = j + 1;
                const isCorrect = optNum === q.correctanswer;
                const isUser = optNum === q.useranswer;
                let bgColor = "#f8f9fa", borderColor = "#cccccc", textColor = "#2c3e50", labelText = "";
                let iconType = null, iconColor = null;

                if (isCorrect) {
                    bgColor = "#eafaf1"; borderColor = "#27ae60"; textColor = "#1e8449";
                    labelText = (isUser) ? "Correct Answer" : "Correct Choice";
                    iconType = 'tick'; iconColor = "#27ae60";
                }
                if (isUser && !isCorrect) {
                    bgColor = "#fdecea"; borderColor = "#e74c3c"; textColor = "#c0392b";
                    labelText = "Your Selection";
                    iconType = 'cross'; iconColor = "#e74c3c";
                }

                doc.roundedRect(55, optY, 485, 22, 5).lineWidth(0.6).strokeColor(borderColor).fillColor(bgColor).fillAndStroke();
                doc.fillColor(textColor).font('Mont-Medium').fontSize(9.5).text(`${optNum}. ${opt}`, 65, optY + 6);
                if (iconType) drawStatusIcon(520, optY + 11, iconType, iconColor);
                optY += 26;
            });

            doc.fillColor("#7f8c8d").font('Mont-Regular').fontSize(8).text(`Time: ${q.timetaken} sec  |  Status: ${q.useranswer === -1 ? "Not Attempted" : "Attempted"}`, 55, optY + 5);
            doc.restore();
            qY = optY + 30;
        });

        // Footer
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.font('Mont-Regular').fontSize(8).fillColor("#7f8c8d").text("BioBrain Learning Analytics Platform", 0, doc.page.height - 30, { align: "center" });
        }

        doc.end(); // finalize PDF
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to generate PDF");
    }
};

exports.downloadResultPdf = async (req, res) => {
    try {
        const mocktestid = req.params.mocktestid;
        const result = await Result.findById(mocktestid).lean();

        if (!result) {
            return res.status(404).send("Result not found");
        }

        // ===== Create PDF =====
        const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

        // ===== Send PDF as download =====
        res.setHeader("Content-Disposition", `attachment; filename=BioBrain_Report_${result.testcode}.pdf`);
        res.setHeader("Content-Type", "application/pdf");

        // Pipe PDF to response
        doc.pipe(res);

        // ===== Register Fonts =====
        // Ensure these paths match your project structure
        doc.registerFont('Lora-Bold', 'fonts/Lora-Bold.ttf');
        doc.registerFont('Mont-Bold', 'fonts/Montserrat-Bold.ttf');
        doc.registerFont('Mont-Medium', 'fonts/Montserrat-Medium.ttf');
        doc.registerFont('Mont-Regular', 'fonts/Montserrat-Regular.ttf');

        // ===== Global Helpers =====
        const drawBg = (p) => p.save().rect(0, 0, p.page.width, p.page.height).fill("#f5f7fb").restore();

        const drawSectionTitle = (title, y) => {
            doc.save();
            doc.rect(40, y, 4, 14).fill("#2f80ed");
            doc.font('Lora-Bold').fontSize(11).fillColor("#2c3e50").text(title, 52, y + 1);
            doc.restore();
            return y + 23;
        };

        const drawInfoGrid = (data, startY) => {
            const boxWidth = 250, boxHeight = 22, gap = 6;
            let lastY = startY;
            data.forEach((item, i) => {
                let col = i % 2, row = Math.floor(i / 2);
                let x = 40 + col * (boxWidth + 15), y = startY + row * (boxHeight + gap);
                doc.save();
                doc.roundedRect(x, y, boxWidth, boxHeight, 4).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
                doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(`${item.label}: `, x + 8, y + 6, { continued: true });
                doc.font('Mont-Medium').fillColor("#555").text(String(item.value || "N/A"));
                doc.restore();
                lastY = y + boxHeight;
            });
            return lastY;
        };

        const drawProgressBar = (label, value, total, color, y) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(label, 40, y);
            doc.roundedRect(40, y + 12, 515, 10, 5).fill("#e5e7eb");
            if (percentage > 0) doc.roundedRect(40, y + 12, (515 * Math.min(percentage, 100)) / 100, 10, 5).fill(color);
            return y + 32;
        };

        const drawStatusIcon = (x, y, type, color) => {
            doc.save();
            doc.circle(x, y, 6).fill(color);
            doc.lineWidth(1.2).strokeColor("white");
            if (type === 'tick') {
                doc.moveTo(x - 3, y).lineTo(x - 1, y + 2).lineTo(x + 3, y - 2).stroke();
            } else {
                doc.moveTo(x - 2, y - 2).lineTo(x + 2, y + 2).moveTo(x + 2, y - 2).lineTo(x - 2, y + 2).stroke();
            }
            doc.restore();
        };

        // ===== START PDF CONTENT =====
        drawBg(doc);

        // 1. HEADER
        doc.save();
        doc.roundedRect(40, 40, 515, 70, 10).fill("#2f80ed");
        doc.font('Lora-Bold').fontSize(22).fillColor("white").text("BioBrain", 60, 55);
        doc.font('Lora-Bold').fontSize(13).text("Performance Analytics Report", 300, 58, { align: "right", width: 230 });
        doc.font('Mont-Regular').fontSize(9).fillColor("#e0e0e0").text(`Generated: ${new Date().toLocaleString()}`, 300, 76, { align: "right", width: 230 });
        doc.restore();

        let currentY = 125;

        // 2. CANDIDATE INFO
        currentY = drawSectionTitle("Candidate Information", currentY);
        currentY = drawInfoGrid([
            { label: "Name", value: result.username },
            { label: "User ID", value: result.userid.toString() },
            { label: "Email", value: result.useremail },
            { label: "Attempt #", value: result.attemptnumber }
        ], currentY);

        // 3. TEST INFO
        currentY += 22;
        currentY = drawSectionTitle("Test Details", currentY);
        currentY = drawInfoGrid([
            { label: "Exam", value: result.examname },
            { label: "Subject", value: result.subjectname },
            { label: "Unit", value: result.unitname },
            { label: "Topic", value: result.topicname },
            { label: "Test Code", value: result.testcode },
            { label: "Difficulty", value: result.difficulty?.toUpperCase() },
            { label: "Started At", value: result.teststartedat ? new Date(result.teststartedat).toLocaleString() : "N/A" },
            { label: "Ended At", value: result.testendedat ? new Date(result.testendedat).toLocaleString() : "N/A" }
        ], currentY);

        // 4. ATTEMPT STATS (Cards)
        currentY += 22;
        currentY = drawSectionTitle("Performance Summary", currentY);
        doc.font('Mont-Bold').fontSize(10).fillColor("#34495e").text("Attempt Statistics", 40, currentY);
        currentY += 18;

        let cardX = 40;
        const stats = [
            { val: result.questionscount, label: "Total Qs", color: "#2f80ed" },
            { val: result.attempted, label: "Attempted", color: "#8e44ad" },
            { val: result.right, label: "Correct", color: "#27ae60" },
            { val: result.wrong, label: "Wrong", color: "#e74c3c" },
            { val: result.skipped, label: "Skipped", color: "#95a5a6" }
        ];
        stats.forEach(s => {
            doc.save().roundedRect(cardX, currentY, 95, 65, 8).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
            doc.rect(cardX, currentY, 95, 4).fill(s.color);
            doc.font('Mont-Bold').fontSize(16).fillColor("#2c3e50").text(s.val, cardX, currentY + 18, { align: 'center', width: 95 });
            doc.font('Mont-Medium').fontSize(8.5).fillColor("#555").text(s.label, cardX, currentY + 42, { align: 'center', width: 95 });
            doc.restore();
            cardX += 105;
        });
        currentY += 80;

        // 5. SCORE METRICS (Cards)
        doc.font('Mont-Bold').fontSize(10).fillColor("#34495e").text("Score & Integrity Metrics", 40, currentY);
        currentY += 18;
        cardX = 40;
        const metrics = [
            { val: `${result.accuracy.toFixed(1)}%`, label: "Accuracy", color: "#27ae60" },
            { val: `${result.percentage.toFixed(1)}%`, label: "Score %", color: "#f39c12" },
            { val: result.finalscore, label: "Final Score", color: "#2f80ed" },
            { val: result.tabswitchcount, label: "Tab Switches", color: "#c0392b" }
        ];
        metrics.forEach(m => {
            const mWidth = 120;
            doc.save().roundedRect(cardX, currentY, mWidth, 65, 8).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
            doc.rect(cardX, currentY, mWidth, 4).fill(m.color);
            doc.font('Mont-Bold').fontSize(16).fillColor("#2c3e50").text(m.val, cardX, currentY + 18, { align: 'center', width: mWidth });
            doc.font('Mont-Medium').fontSize(8.5).fillColor("#555").text(m.label, cardX, currentY + 42, { align: 'center', width: mWidth });
            doc.restore();
            cardX += mWidth + 11.5;
        });
        currentY += 80;

        // 6. PROGRESS BARS
        currentY += 22;
        currentY = drawSectionTitle("Performance Breakdown", currentY);
        currentY = drawProgressBar("Correct Answers", result.right, result.questionscount, "#27ae60", currentY);
        currentY = drawProgressBar("Wrong Answers", result.wrong, result.questionscount, "#e74c3c", currentY);
        currentY = drawProgressBar("Skipped", result.skipped, result.questionscount, "#2f80ed", currentY);

        // 7. QUESTION WISE ANALYSIS
        doc.addPage();
        drawBg(doc);
        let qY = drawSectionTitle("Question Wise Analysis", 40);

        result.questions.forEach((q, i) => {
            // Check for page overflow
            if (qY > 620) { doc.addPage(); drawBg(doc); qY = 40; }
            
            doc.save();
            // Question Container
            doc.roundedRect(40, qY, 515, 145, 6).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
            doc.fillColor("#2c3e50").font('Mont-Bold').fontSize(10).text(`Q${i + 1}. ${q.question}`, 55, qY + 12, { width: 485 });

            let optY = qY + 35;
            const options = [q.opt1, q.opt2, q.opt3, q.opt4];

            options.forEach((opt, j) => {
                const optNum = j + 1;
                const isCorrect = optNum === q.correctanswer;
                const isUser = optNum === q.useranswer; // Matches your null default
                
                let bgColor = "#f8f9fa", borderColor = "#cccccc", textColor = "#2c3e50", labelText = "";
                let iconType = null, iconColor = null;

                if (isCorrect) {
                    bgColor = "#eafaf1"; borderColor = "#27ae60"; textColor = "#1e8449";
                    labelText = (isUser) ? "Correct Answer" : "Correct Choice";
                    iconType = 'tick'; iconColor = "#27ae60";
                }
                if (isUser && !isCorrect) {
                    bgColor = "#fdecea"; borderColor = "#e74c3c"; textColor = "#c0392b";
                    labelText = "Your Selection";
                    iconType = 'cross'; iconColor = "#e74c3c";
                }

                // Draw Option Box
                doc.roundedRect(55, optY, 485, 22, 5).lineWidth(0.6).strokeColor(borderColor).fillColor(bgColor).fillAndStroke();
                doc.fillColor(textColor).font('Mont-Medium').fontSize(9.5).text(`${optNum}. ${opt}`, 65, optY + 6, { width: 350 });
                
                // Draw Indicator Labels and Icons
                if (iconType) {
                    drawStatusIcon(520, optY + 11, iconType, iconColor);
                    doc.font('Mont-Bold').fontSize(8).fillColor(iconColor).text(labelText, 55, optY + 7, { 
                        align: 'right', 
                        width: 450 
                    });
                }
                optY += 26;
            });

            // Meta Info Footer (Individual Question)
            const marksText = q.iscorrect ? `+${q.marks}` : `-${q.negativemarks}`;
            doc.fillColor("#7f8c8d").font('Mont-Regular').fontSize(8).text(`Time: ${q.timetaken}s | Marks: ${marksText} | Status: ${q.useranswer === null ? "Skipped" : "Attempted"}`, 55, optY + 5);
            doc.restore();
            
            qY = optY + 30; // Spacing for next question
        });

        // 8. ABOUT BIOBRAIN (Last Page Section)
        if (qY > 600) { doc.addPage(); drawBg(doc); qY = 40; } else { qY += 20; }
        doc.save();
        doc.roundedRect(40, qY, 515, 100, 8).lineWidth(0.5).strokeColor("#2f80ed").dash(5, {space: 2}).stroke();
        doc.font('Lora-Bold').fontSize(12).fillColor("#2f80ed").text("About BioBrain", 55, qY + 15);
        doc.font('Mont-Regular').fontSize(9).fillColor("#444").text(
            "BioBrain is a cutting-edge Learning Analytics Platform designed to empower students through data-driven insights. Our system provides deep psychometric analysis of test performance, identifying conceptual gaps and offering precise recommendations for academic improvement. For technical support or institutional inquiries, please visit www.biobrain.com.",
            55, qY + 35, { width: 485, align: 'justify', lineGap: 3 }
        );
        doc.restore();

        // 9. GLOBAL FOOTER (Page Numbers / Branding)
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.font('Mont-Regular').fontSize(8).fillColor("#7f8c8d").text("BioBrain Learning Analytics Platform", 0, doc.page.height - 30, { align: "center" });
            doc.text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 20, { align: "center" });
        }

        doc.end();

    } catch (err) {
        console.error("PDF Error:", err);
        if (!res.headersSent) {
            res.status(500).send("Failed to generate PDF Report");
        }
    }
};