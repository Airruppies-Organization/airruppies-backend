const express = require("express");
const { login } = require("../controllers/cashierControllers");
const router = express.Router();

router.post("/login", login);

module.exports = router;
