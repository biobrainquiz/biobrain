const Topic = require("../models/Topic");
const escapeHtml = require("../utils/escapeHtml"); // adjust if needed
const logger = require("../utils/logger");

exports.getTopicsByExamAndSubjectAndUnit = async (req, res) => {
  try {
    const { examcode, subjectcode, unitcode } = req.params;

    const topics = await Topic.find({ examcode, subjectcode, unitcode })
      .sort({ topiccode: 1 })
      .select("topiccode topicname -_id")
      .lean();

    topics.forEach(t => {
      t.topicname = escapeHtml(t.topicname);
    });

    return res.json(topics);

  } catch (err) {
    logger.error("Error fetching topics by exam+subject+unit:", err);
    return res.status(500).json([]);
  }
};