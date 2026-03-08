// services/ExamSession.js
class ExamSession {
    constructor({ examcode, subjectcode, unitcode, topiccode, count, difficulty } = {}) {

        this.examCode = examcode;
        this.subjectCode = subjectcode;
        this.unitCode = unitcode;
        this.topicCode = topiccode;
        this.questionsCount = count;
        this.difficulty = difficulty;

        this.userId = null;
        this.userName = null;
        this.exampaperCode = null;
        this.examName = null;
        this.subjectName = null;
        this.unitName = null;
        this.topicName = null;


        const now = new Date();
        this.examStartedAt = now.toISOString(); // e.g., "2026-03-08T12:18:07.123Z"
        this.examEndedAt = null; // will fill later

        this.examEndedAt = null;
        this.duration = 0; // in seconds

        // results computation
        this.attempted = 0;
        this.right = 0;
        this.wrong = 0;
        this.skipped = 0;
        this.positiveMarks = 0;
        this.negativeMarks = 0;
        this.finalScore = 0;
        this.percentage = 0;
        this.accuracy = 0;

        // analytics / anti-cheating
        this.tabSwitchCount = 0;
        this.device = "";
        this.ipAddress = "";

        // optional: topic/unit stats for dashboard
        this.topicStats = [];
        this.unitStats = [];

        // questions & answers
        this.questions = []; // array of {questionId, text, options, selectedOption, correctOption, isCorrect, timeTaken}
        this.attemptNumber = 1;
        this.answers = null; // { questionId: selectedOption }
    }

    addQuestion(questionObj) {
        this.questions.push(questionObj);
        this.totalQuestions = this.questions.length;
    }

    calculateScore() {
        this.attempted = Object.keys(this.answers || {}).length;
        this.finalScore = 0;
        this.right = 0;
        this.wrong = 0;

        // ✅ Evaluate answers
        this.questions.forEach(q => {
            const userAns = this.answers[q._id];

            if (userAns) {
                if (userAns == q.answer) {
                    this.finalScore += q.marks;
                    this.right++;
                } else {
                    this.wrong++;
                }
            }
        });
        this.skipped = this.totalQuestions - this.attempted;
        const negativeMarking = 0; // example negative marking per wrong answer 
        this.positiveMarks = this.right; // can multiply by marks per question
        this.negativeMarks = this.wrong * negativeMarking;
        this.finalScore = this.positiveMarks - this.negativeMarks;
        this.percentage = (this.finalScore / this.totalQuestions) * 100;
        this.accuracy = this.attempted ? (this.right / this.attempted) * 100 : 0;
    }

    getExampaperCode() {

        const parts = [];
        if (this.examCode) parts.push(this.examCode);
        if (this.subjectCode) parts.push(this.subjectCode);
        if (this.unitCode) parts.push(this.unitCode);
        if (this.topicCode) parts.push(this.topicCode);
        return parts.join("_");
    }
}
module.exports = ExamSession;