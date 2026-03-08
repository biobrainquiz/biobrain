// services/ExamSession.js
class ExamSession {
    constructor({ userid, username, exampaperCode, examcode, subjectcode, unitcode, topiccode }) {
        // student info
        this.userid = userid;
        this.username = username;

        // exam identifiers
        this.exampaperCode = this.exampaperCode;
        this.examcode = examcode;

        this.subjectcode = subjectcode;
        this.unitcode = unitcode;
        this.topiccode = topiccode;

        this.examname = null;
        this.subjectname = null;
        this.unitname = null;
        this.topicname = null;

        // exam timing
        this.startedAt = null;
        this.submittedAt = null;
        this.duration = 0; // in seconds
        this.examdate = null;
        this.examtime = null;

        // questions & answers
        this.questions = []; // array of {questionId, text, options, selectedOption, correctOption, isCorrect, timeTaken}
        this.difficulty = null;
        this.attemptNumber = 1;

        // scoring
        this.noq = 0;
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
    }

    addQuestion(questionObj) {
        this.questions.push(questionObj);
        this.totalQuestions = this.questions.length;
    }

    calculateScore() {
        this.attempted = this.questions.filter(q => q.selectedOption).length;
        this.correct = this.questions.filter(q => q.isCorrect).length;
        this.wrong = this.questions.filter(q => q.selectedOption && !q.isCorrect).length;
        this.skipped = this.totalQuestions - this.attempted;

        this.positiveMarks = this.correct; // can multiply by marks per question
        this.negativeMarks = this.wrong * 0.25; // example negative marking
        this.finalScore = this.positiveMarks - this.negativeMarks;
        this.percentage = (this.finalScore / this.totalQuestions) * 100;
        this.accuracy = this.attempted ? (this.correct / this.attempted) * 100 : 0;
    }

    getExampaperCode(examcode, subjectcode, unitcode, topiccode) {

        const parts = [];
        if (examcode) parts.push(examcode);
        if (subjectcode) parts.push(subjectcode);
        if (unitcode) parts.push(unitcode);
        if (topiccode) parts.push(topiccode);
        return parts.join("_");
    }
}
module.exports = ExamSession;