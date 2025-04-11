const express = require("express");
const { login, createPassword } = require("../controllers/cashierControllers");
const router = express.Router();

router.post("/login", login);
router.post("/createPassword", createPassword);

module.exports = router;
