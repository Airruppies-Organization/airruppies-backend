const express = require("express");
const { createUser, login } = require("../controllers/userControllers");
const router = express.Router();

router.post("/createuser", createUser);
router.post("/login", login);

module.exports = router;
