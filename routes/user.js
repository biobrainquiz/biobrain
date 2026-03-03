const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const userController = require("../controllers/userController");

router.get("/profile", requireLogin, userController.getProfile);
module.exports = router;