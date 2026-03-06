const winston = require("winston");
const { sendLog } = require("../routes/adminLogs");

const logger = winston.createLogger({

level:"info",

format:winston.format.combine(
winston.format.timestamp(),
winston.format.json()
),

transports:[

new winston.transports.File({
filename:"logs/info/info.log",
level:"info"
}),

new winston.transports.File({
filename:"logs/error/error.log",
level:"error"
})

]

});


// Hook to broadcast logs

const originalLog = logger.log.bind(logger);

logger.log = function(level,message){

sendLog({level,message,time:new Date()});

originalLog(level,message);

};

module.exports = logger;