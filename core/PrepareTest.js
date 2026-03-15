class PrepareTest {
    constructor({ examcode, subjectcode, pageresult, pageno, totalpages, resultsforgraph } = {}) {

        this.examcode = examcode;
        this.subjectcode = subjectcode;
        this.pageresult = pageresult;
        this.pageno = pageno;
        this.totalpages = totalpages;
        this.resultsforgraph = resultsforgraph;
    }
}
module.exports = PrepareTest;