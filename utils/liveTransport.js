const Transport = require("winston-transport");
const { addClient,
    removeClient,
    broadcast } = require("./liveLogs");

class LiveTransport extends Transport {

    log(info, callback) {

        setImmediate(() => {
            this.emit("logged", info);
        });

        broadcast({
            level: info.level,
            message: info.message,
            timestamp: info.timestamp
        });

        callback();
    }
}

module.exports = LiveTransport;