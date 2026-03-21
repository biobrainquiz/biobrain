// services/ExamSession.js
class ExamSession {
    constructor({ examcode, subjectcode, unitcode, topiccode, count, difficulty } = {}) {

        
        this.examcode = examcode;
        this.subjectcode = subjectcode;
        this.unitcode = unitcode;
        this.topiccode = topiccode;

        this.difficulty = difficulty;

        this.userid = null;
        this.username = null;
        this.useremail = null;
        this.isuserpremium = false;
        this.userroles = [];
        this.exampapercode = null;
        this.examname = null;
        this.subjectname = null;
        this.unitname = null;
        this.topicname = null;


        this.examstartedat = new Date().toISOString(); // e.g., "2026-03-08T12:18:07.123Z"
        this.examendedat = null; // will fill later
        this.duration = 0; // in seconds

        // results computation
        this.attempted = 0;
        this.right = 0;
        this.wrong = 0;
        this.skipped = 0;
        this.positivemarks = 0;
        this.negativemarks = 0;
        this.finalscore = 0;
        this.percentage = 0;
        this.accuracy = 0;

        // analytics / anti-cheating
        this.tabswitchcount = 0;
        this.device = "";
        this.ipaddress = "";

        // optional: topic/unit stats for dashboard
        this.topicstats = [];
        this.unitstats = [];

        // questions & answers
        this.questions = []; // array of {questionId, text, options, selectedOption, correctOption, isCorrect, timeTaken}
        this.questionscount = count;
        this.answers = null; // { questionId: selectedOption }
        this.attemptnumber = 1;

        this.resultid=null;
    }

    updateIsUserPremiumFlag(user) {
        console.log(user);
        // Check if any role in the array matches the premium role ID
        this.isuserpremium = Array.isArray(user.roles)
            && user.roles.some(r => r._id === "650f1a2b3c4d5e6f7a8b9014");

            this.userroles=user.roles;

        /*this.isuserpremium = Array.isArray(user.roles) 
        && user.roles.some(r => r.role === "premium_student");*/
    }

    calculateScore() {
        this.attempted = Object.keys(this.answers || {}).length;
        this.finalscore = 0;
        this.right = 0;
        this.wrong = 0;

        // ✅ Evaluate answers
        this.questions.forEach(q => {
            const userans = this.answers[q._id];

            if (userans !== undefined && userans !== null) {
                if (userans == q.answer) {
                    this.right++;
                } else {
                    this.wrong++;
                }
            }
        });

        this.skipped = this.questionscount - this.attempted;

        const negativemarking = 0; // example negative marking per wrong answer 
        this.positivemarks = this.right; // can multiply by marks per question
        this.negativemarks = this.wrong * negativemarking;

        this.finalscore = this.positivemarks - this.negativemarks;

        // ✅ Round to nearest integer
        this.percentage = Math.round((this.finalscore / this.questionscount) * 100);
        this.accuracy = this.attempted ? Math.round((this.right / this.attempted) * 100) : 0;
    }

    getExampaperCode() {

        const parts = [];
        if (this.examcode) parts.push(this.examcode);
        if (this.subjectcode) parts.push(this.subjectcode);
        if (this.unitcode) parts.push(this.unitcode);
        if (this.topiccode) parts.push(this.topiccode);
        return parts.join("_");
    }
}
module.exports = ExamSession;
