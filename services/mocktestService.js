const Result = require("../models/Result");
const PrepareTest = require("../core/PrepareTest");
const logger = require("../utils/logger");
const crypto = require("crypto");

async function getResultsForPaging(username, examcode, subjectcode, pageno) {
    const pageLimit = 5;      // no.of records per page

    let resultCount = await Result.countDocuments({
        username,
        examcode,
        subjectcode
    });

    const totalPages = Math.ceil(resultCount / pageLimit);

    pageResult = await Result.find({
        username,
        examcode,
        subjectcode
    }).sort({ createdAt: 1 })
        .skip((pageno - 1) * pageLimit)
        .limit(pageLimit)
        .lean();

    return { pageResult, totalPages };
}

async function getResultsForGraph(username, examcode, subjectcode, pageno) {
    const resultsForGraph = await Result.find({
        username,
        examcode,
        subjectcode
    }).sort({ createdAt: 1 });

    return resultsForGraph;
}

exports.init = async (req, res) => {
  try {

    const { examcode, subjectcode } = req.params;
    const username = req.session?.user?.username;
    const pageno = 1;

    const { pageResult, totalPages } =
      await getResultsForPaging(username, examcode, subjectcode, pageno);

    const resultsForGraph =
      await getResultsForGraph(username, examcode, subjectcode);

    const prepareTestObj = new PrepareTest({
      examcode,
      subjectcode,
      pageResult,
      pageno,
      totalPages,
      resultsForGraph
    });

    return prepareTestObj;

  } catch (err) {

    logger.error("Prepare Quiz Error:", err);

    const prepareTestObj = new PrepareTest({
      examcode,
      subjectcode,
      pageResult: [],
      pageno: 1,
      totalPages: 1,
      resultsForGraph: []
    });

    return prepareTestObj;
  }
};
