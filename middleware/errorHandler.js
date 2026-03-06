const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {

    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    res.status(500).send("Internal Server Error");
}

module.exports = errorHandler;