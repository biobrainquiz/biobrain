// hashPasswordCli.js
const bcrypt = require("bcryptjs");

// Read password from command line arguments
const password = process.argv[2];

if (!password) {
  console.error("Usage: node hashPasswordCli.js <password>");
  process.exit(1);
}

// Async function to hash password
async function generatePasswordHash(pwd) {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(pwd, salt);
  return hashed;
}

// Immediately invoke async function
(async () => {
  try {
    const hashedPassword = await generatePasswordHash(password);
    console.log("Hashed password:", hashedPassword);
  } catch (err) {
    console.error("Error generating hash:", err);
  }
})();