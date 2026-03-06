const winston = require("winston");
require("winston-daily-rotate-file");

const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

const logger = winston.createLogger({
    level: "info",

    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        logFormat
    ),

    transports: [

        // Error logs
        new winston.transports.DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            level: "error",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d"
        }),

        // Combined logs
        new winston.transports.DailyRotateFile({
            filename: "logs/combined-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d"
        }),

        // Console logs
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

module.exports = logger;