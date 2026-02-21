const express = require("express");
const app = express();
const path = require("path");

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Mock user database (replace with MongoDB later)
const users = [
  { username: "user1", password: "pass1" },
  { username: "user2", password: "pass2" }
];

// Login API
app.post("/api/login", (req,res)=>{
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if(user){
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid username or password" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));