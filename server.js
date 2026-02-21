const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("QUIZ COMING!!! 🚀");
});

app.listen(1420, () => {
  console.log("Server running on http://localhost:1420");
});