const path = require("path");
const winston = require("winston");
require("winston-daily-rotate-file");

const LiveTransport = require("./liveTransport");   // live logs transport


const logFormat = winston.format.printf((info) => {

    const { level, message, timestamp, stack, ...meta } = info;

    const metaString = Object.keys(meta).length
        ? JSON.stringify(meta)
        : "";

    return `${timestamp} [${level.toUpperCase()}]: ${stack || message} ${metaString}`;

});


const logger = winston.createLogger({

    level: "info",

    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        logFormat
    ),

    transports: [

        // ERROR LOGS
        new winston.transports.DailyRotateFile({
            filename: path.join(__dirname, "../logs/error/error-%DATE%.log"),
            level: "error",
            datePattern: "DD-MM-YYYY",
            maxSize: "20m",
            maxFiles: "14d"
        }),

        // INFO LOGS
        new winston.transports.DailyRotateFile({
            filename: path.join(__dirname, "../logs/info/info-%DATE%.log"),
            level: "info",
            datePattern: "DD-MM-YYYY",
            maxSize: "20m",
            maxFiles: "14d"
        }),

        // COMBINED LOGS
        new winston.transports.DailyRotateFile({
            filename: path.join(__dirname, "../logs/combined/combined-%DATE%.log"),
            datePattern: "DD-MM-YYYY",
            maxSize: "20m",
            maxFiles: "14d"
        }),

        // CONSOLE OUTPUT
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),

        // LIVE DASHBOARD LOGS
        new LiveTransport()

    ]

});


module.exports = logger;