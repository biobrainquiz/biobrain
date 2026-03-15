class PrepareTest {
    constructor({ examcode, subjectcode, pageResult, pageno, totalPages, resultsForGraph } = {}) {

        this.examcode = examcode;
        this.subjectcode = subjectcode;
        this.pageResult = pageResult;
        this.pageno = pageno;
        this.totalPages = totalPages;
        this.resultsForGraph = resultsForGraph;
    }
}
module.exports = PrepareTest;