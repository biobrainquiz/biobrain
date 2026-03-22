const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const path = require("path");
const ejs = require("ejs");

const QRCode = require('qrcode');
const PDFDocument = require("pdfkit");
const Result = require("../models/Result");

const logger = require("../utils/logger");

// programatically generate pdf
exports.downloadResultPdf = async (req, res) => {
    try {
        const mocktestid = req.params.mocktestid;
        const result = await Result.findById(mocktestid).lean();

        if (!result) {
            return res.status(404).send("Result not found");
        }

        //Generate QR Code(do this before or during PDF creation)
        const qrCodeDataUri = await QRCode.toDataURL(process.env.BASE_URI, {
            margin: 1,
            width: 100,
            color: {
                dark: '#2f80ed', // Matches BioBrain Blue
                light: '#ffffff'
            }
        });

        // ===== Create PDF =====
        const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

        // ===== Send PDF as download =====
        res.setHeader("Content-Disposition", `attachment; filename=BioBrain_Result_Report_${result._id}.pdf`);
        res.setHeader("Content-Type", "application/pdf");

        // Pipe PDF to response
        doc.pipe(res);

        // ===== Register Fonts =====
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

        // NEW: Dynamic Info Grid Helper
        const drawDynamicInfoGrid = (data, startY) => {
            const boxWidth = 250, gap = 15;
            let currentY = startY;

            for (let i = 0; i < data.length; i += 2) {
                const item1 = data[i];
                const item2 = data[i + 1];

                // Measure text heights
                const h1 = doc.font('Mont-Medium').fontSize(9).heightOfString(`${item1.label}: ${item1.value}`, { width: boxWidth - 16 }) + 14;
                const h2 = item2 ? doc.font('Mont-Medium').fontSize(9).heightOfString(`${item2.label}: ${item2.value}`, { width: boxWidth - 16 }) + 14 : 0;

                const rowHeight = Math.max(h1, h2, 22);

                // Draw Box 1
                doc.save().roundedRect(40, currentY, boxWidth, rowHeight, 4).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
                doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(`${item1.label}: `, 48, currentY + 6, { continued: true });
                doc.font('Mont-Medium').fillColor("#555").text(String(item1.value || "N/A"), { width: boxWidth - 16 });
                doc.restore();

                // Draw Box 2
                if (item2) {
                    const x2 = 40 + boxWidth + gap;
                    doc.save().roundedRect(x2, currentY, boxWidth, rowHeight, 4).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
                    doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(`${item2.label}: `, x2 + 8, currentY + 6, { continued: true });
                    doc.font('Mont-Medium').fillColor("#555").text(String(item2.value || "N/A"), { width: boxWidth - 16 });
                    doc.restore();
                }
                currentY += rowHeight + 6;
            }
            return currentY;
        };

        const drawProgressBar = (label, value, total, color, y) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(label, 40, y);
            doc.roundedRect(40, y + 12, 515, 10, 5).fill("#e5e7eb");
            if (percentage > 0) doc.roundedRect(40, y + 12, (515 * Math.min(percentage, 100)) / 100, 10, 5).fill(color);
            return y + 32;
        };

        const drawStatusIcon = (x, y, type, color) => {
            doc.save().circle(x, y, 6).fill(color);
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

        // 1. STYLISH HEADER
        doc.save();

        // Main Header Background (Deep BioBrain Blue)
        doc.roundedRect(40, 40, 515, 75, 10).fill("#2f80ed");

        // Subtle Gradient Overlay (Lighter blue on the right for depth)
        doc.opacity(0.15)
            .rect(300, 40, 255, 75)
            .fillColor("white")
            .fill();
        doc.opacity(1);

        // Left Side: Brand Identity
        doc.font('Lora-Bold').fontSize(24).fillColor("white")
            .text("BioBrain", 60, 58, { characterSpacing: 1 });

        doc.font('Mont-Regular').fontSize(8).fillColor("#d1e3ff")
            .text("LEARNING ANALYTICS", 60, 88, { characterSpacing: 2 });

        // Right Side: Report Metadata
        doc.font('Lora-Bold').fontSize(12).fillColor("white")
            .text("Performance Analytics Report", 300, 58, { align: "right", width: 235 });

        // Icons/Labels for "Generated"
        doc.font('Mont-Medium').fontSize(8).fillColor("#e0e0e0")
            .text("REPORT GENERATED ON", 300, 78, { align: "right", width: 235 });

        doc.font('Mont-Bold').fontSize(8.5).fillColor("white")
            .text(new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }).toUpperCase(), 300, 88, { align: "right", width: 235 });

        doc.restore();
        let currentY = 125;

        // 2. CANDIDATE INFO
        currentY = drawSectionTitle("Candidate Information", currentY);
        currentY = drawDynamicInfoGrid([
            { label: "Name", value: result.username },
            { label: "User ID", value: result.userid.toString() },
            { label: "Email", value: result.useremail },
            { label: "Attempt #", value: result.attemptnumber }
        ], currentY);

        // --- Date Formatting Helper ---
        const formatDateTime = (date) => {
            if (!date) return "N/A";
            return new Date(date).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        };

        // --- Duration Calculation Helper ---
        const getDuration = (start, end) => {
            if (!start || !end) return "N/A";
            const diff = Math.abs(new Date(end) - new Date(start));
            const mins = Math.floor(diff / 60000);
            const secs = ((diff % 60000) / 1000).toFixed(0);
            return `${mins}m ${secs}s`;
        };

        // 3. TEST INFO 
        currentY += 15;
        currentY = drawSectionTitle("Test Details", currentY);
        currentY = drawDynamicInfoGrid([
            { label: "Exam", value: result.examname },
            { label: "Subject", value: result.subjectname },
            { label: "Unit", value: result.unitname },
            { label: "Topic", value: result.topicname },
            { label: "Test ID", value: result._id.toString() },
            { label: "Test Code", value: result.testcode },
            { label: "Difficulty", value: result.difficulty?.toUpperCase() },
            { label: "Total Duration", value: getDuration(result.teststartedat, result.testendedat) },
            { label: "Started At", value: formatDateTime(result.teststartedat) },
            { label: "Ended At", value: formatDateTime(result.testendedat) }
        ], currentY);

        // 4. ATTEMPT STATS (Cards)
        currentY += 20;
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
            doc.restore(); cardX += 105;
        });
        currentY += 80;

        // 5. SCORE METRICS (Cards)
        doc.font('Mont-Bold').fontSize(10).fillColor("#34495e").text("Score & Integrity Metrics", 40, currentY);
        currentY += 18;
        cardX = 40;

        const metrics = [
            { val: `${result.accuracy.toFixed(1)}%`, label: "Accuracy", color: "#27ae60" },
            { val: `${result.percentage.toFixed(1)}%`, label: "Score %", color: "#f39c12" },
            { val: result.finalscore, label: "Final Score", color: "#2f80ed" }
        ];

        metrics.forEach(m => {
            const mWidth = 162; // Increased width to fill the row since we have 3 cards now
            doc.save()
                .roundedRect(cardX, currentY, mWidth, 65, 8)
                .lineWidth(0.8)
                .strokeColor("#cccccc")
                .fillColor("white")
                .fillAndStroke();

            doc.rect(cardX, currentY, mWidth, 4).fill(m.color);

            doc.font('Mont-Bold').fontSize(16).fillColor("#2c3e50")
                .text(m.val, cardX, currentY + 18, { align: 'center', width: mWidth });

            doc.font('Mont-Medium').fontSize(8.5).fillColor("#555")
                .text(m.label, cardX, currentY + 42, { align: 'center', width: mWidth });

            doc.restore();
            cardX += mWidth + 14.5;
        });
        currentY += 80;


        // 6. PROGRESS BARS WITH PERCENTAGE LABELS
        currentY += 22;
        currentY = drawSectionTitle("Performance Breakdown", currentY);

        const drawEnhancedProgressBar = (label, value, total, color, y) => {
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            const barWidth = 515;
            const filledWidth = (barWidth * Math.min(percentage, 100)) / 100;

            doc.font('Mont-Bold').fontSize(9).fillColor("#2c3e50").text(label, 40, y);

            // Draw background bar
            doc.roundedRect(40, y + 12, barWidth, 14, 7).fill("#e5e7eb");

            // Draw filled bar
            if (percentage > 0) {
                doc.roundedRect(40, y + 12, filledWidth, 14, 7).fill(color);
            }

            // Draw Percentage Text
            doc.font('Mont-Bold').fontSize(8.5).fillColor(percentage > 5 ? "white" : "#2c3e50")
                .text(`${percentage}%`, 45, y + 15, { width: barWidth, align: 'left' });

            return y + 38;
        };

        currentY = drawEnhancedProgressBar("Correct Answers", result.right, result.questionscount, "#27ae60", currentY);
        currentY = drawEnhancedProgressBar("Wrong Answers", result.wrong, result.questionscount, "#e74c3c", currentY);
        currentY = drawEnhancedProgressBar("Skipped Questions", result.skipped, result.questionscount, "#2f80ed", currentY);

        // 7. QUESTION WISE ANALYSIS
        doc.addPage();
        drawBg(doc);
        let qY = drawSectionTitle("Question Wise Analysis", 40);

        result.questions.forEach((q, i) => {
            // 1. MEASURE DYNAMIC HEIGHTS
            const qText = `Q${i + 1}. ${q.question}`;
            const qH = doc.font('Mont-Bold').fontSize(10).heightOfString(qText, { width: 485 });

            const options = [q.opt1, q.opt2, q.opt3, q.opt4];
            const optHeights = options.map(opt => doc.font('Mont-Medium').fontSize(9.5).heightOfString(opt, { width: 330 }) + 14);
            const totalOptH = optHeights.reduce((a, b) => a + b, 0) + (options.length * 5);

            // Total height = padding + question height + space + options height + footer space
            const totalBoxH = qH + totalOptH + 45;

            // 2. PAGE OVERFLOW CHECK
            if (qY + totalBoxH > 780) {
                doc.addPage();
                drawBg(doc);
                qY = 40;
                qY = drawSectionTitle("Question Wise Analysis (Continued)", qY);
            }

            doc.save();
            // 3. DRAW MAIN CONTAINER
            doc.roundedRect(40, qY, 515, totalBoxH, 6).lineWidth(0.8).strokeColor("#cccccc").fillColor("white").fillAndStroke();
            doc.fillColor("#2c3e50").font('Mont-Bold').fontSize(10).text(qText, 55, qY + 12, { width: 485 });

            let currentOptY = qY + 12 + qH + 10;

            options.forEach((opt, j) => {
                const optNum = j + 1;
                const h = optHeights[j];
                const isCorrect = optNum === q.correctanswer;
                const isUserChoice = optNum === q.useranswer;
                const wasSkipped = q.useranswer === -1;

                let bgColor = "#f8f9fa", borderColor = "#cccccc", textColor = "#2c3e50", labelText = "";
                let iconType = null, iconColor = null;

                // --- REFINED COLOR LOGIC ---
                if (isCorrect) {
                    if (wasSkipped) {
                        // SKIPPED: Professional Blue Theme
                        bgColor = "#ebf5ff"; borderColor = "#2f80ed"; textColor = "#2255a4";
                        labelText = "Skipped / Correct Answer";
                        iconType = 'tick'; iconColor = "#2f80ed";
                    } else if (isUserChoice) {
                        // CORRECT: Vibrant Green Theme
                        bgColor = "#eafaf1"; borderColor = "#27ae60"; textColor = "#1e8449";
                        labelText = "Your Answer / Correct Answer";
                        iconType = 'tick'; iconColor = "#27ae60";
                    } else {
                        // CORRECT OPTION (when user picked wrong): Green
                        bgColor = "#eafaf1"; borderColor = "#27ae60"; textColor = "#1e8449";
                        labelText = "Correct Answer";
                        iconType = 'tick'; iconColor = "#27ae60";
                    }
                } else if (!wasSkipped && isUserChoice) {
                    // WRONG CHOICE: Red Theme
                    bgColor = "#fdecea"; borderColor = "#e74c3c"; textColor = "#c0392b";
                    labelText = "Your Answer";
                    iconType = 'cross'; iconColor = "#e74c3c";
                }

                // Draw Option Box
                doc.roundedRect(55, currentOptY, 485, h, 4).lineWidth(0.6).strokeColor(borderColor).fillColor(bgColor).fillAndStroke();
                doc.fillColor(textColor).font('Mont-Medium').fontSize(9.5).text(`${optNum}. ${opt}`, 65, currentOptY + (h / 2 - 5), { width: 330 });

                // Draw Icon and Text Label
                if (labelText) {
                    drawStatusIcon(525, currentOptY + (h / 2), iconType, iconColor);
                    doc.font('Mont-Bold').fontSize(7.5).fillColor(iconColor).text(labelText, 360, currentOptY + (h / 2 - 4), { align: 'right', width: 150 });
                }

                currentOptY += h + 5;
            });

            // 4. META INFO FOOTER
            const marksValue = q.useranswer === -1 ? 0 : (q.iscorrect ? q.marks : -q.negativemarks);
            const statusLabel = q.useranswer === -1 ? "Skipped" : "Attempted";

            doc.fillColor("#7f8c8d").font('Mont-Regular').fontSize(8)
                .text(`Time: ${q.timetaken}s | Marks: ${marksValue >= 0 ? '+' + marksValue : marksValue} | Status: ${statusLabel}`, 55, currentOptY + 4);

            doc.restore();

            // Vertical spacing for next question
            qY = currentOptY + 40;
        });

        // 8. ABOUT BIOBRAIN (with QR Code)
        if (qY > 600) { doc.addPage(); drawBg(doc); qY = 40; } else { qY += 30; }

        doc.save();
        // Container
        doc.roundedRect(40, qY, 515, 110, 8).lineWidth(0.5).strokeColor("#2f80ed").dash(5, { space: 2 }).stroke();

        // Add the QR Code Image on the right side
        doc.image(qrCodeDataUri, 445, qY + 10, { width: 90 });

        // Text Content (Adjusted width to 380 to make room for QR)
        doc.font('Lora-Bold').fontSize(12).fillColor("#2f80ed").text("About BioBrain", 55, qY + 15);
        doc.font('Mont-Regular').fontSize(9).fillColor("#444")
            .text(
                `BioBrain is a cutting-edge Learning Analytics Platform designed to empower students through data-driven insights. Scan the QR code to visit our platform or go to `,
                55, qY + 35,
                {
                    width: 380,
                    align: 'justify',
                    lineGap: 3,
                    continued: true
                }
            )
            .font('Mont-Bold').fillColor("#2f80ed").text(`${process.env.BASE_URI}.`);
        doc.restore();

        doc.end();

    } catch (err) {
        logger.error("Error generating PDF programatically:", err);
        if (!res.headersSent) res.status(500).send("Failed to generate PDF Report");
    }
};

// puppeteer pdf generator that generates pdf from html or .ejs page
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
        logger.error("Error generating PDF using puppeteer:", err);
        if (!res.headersSent) {
            res.status(500).send("PDF generation failed");
        }

    } finally {
        if (browser) {
            await browser.close();
        }
    }
};