const clients = [];

function addClient(res) {
    clients.push(res);
}

function removeClient(res) {
    const index = clients.indexOf(res);
    if (index !== -1) {
        clients.splice(index, 1);
    }
}

function broadcast(log) {
    clients.forEach(client => {
        client.write(`data: ${JSON.stringify(log)}\n\n`);
    });
}

module.exports = {
    addClient,
    removeClient,
    broadcast
};