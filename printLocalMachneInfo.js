// XYZ.js
const express = require('express');
const UAParser = require('ua-parser-js');
const os = require('os');

const app = express();
const PORT = 3000;

// ----------------------------
// 1️⃣ Print local machine info (CLI)
// ----------------------------
const networkInterfaces = os.networkInterfaces();
const ipAddresses = [];

for (const iface of Object.values(networkInterfaces)) {
  iface.forEach((address) => {
    if (!address.internal && address.family === 'IPv4') {
      ipAddresses.push(address.address);
    }
  });
}

console.log('--- Local Machine Info ---');
console.log('Local IP Addresses:', ipAddresses.length ? ipAddresses.join(', ') : 'None');
console.log(`OS: ${os.type()} ${os.release()} (${os.platform()})`);
console.log('--------------------------\n');

// ----------------------------
// 2️⃣ Express server to capture client info
// ----------------------------
app.get('/', (req, res) => {
  // 2a. Client IP
  const clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .split(',')[0]
    .trim();

  // 2b. Client device/browser info
  const parser = new UAParser(req.headers['user-agent']);
  const result = parser.getResult();
  const device = `${result.os.name || 'Unknown OS'} ${result.os.version || ''} / ${result.browser.name || 'Unknown Browser'} ${result.browser.version || ''}`;

  console.log('--- Client Accessed ---');
  console.log('Client IP:', clientIP);
  console.log('Device/Browser:', device);
  console.log('----------------------\n');

  res.send(`Hello! Check console for client IP and device info.\nYour IP: ${clientIP}\nDevice: ${device}`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open this URL in a browser to see client IP and device info.\n');
});