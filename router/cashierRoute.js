const express = require("express");
const { login, getBill } = require("../controllers/cashierControllers");
const router = express.Router();

router.post("/login", login);
router.post("/getbill", getBill);

module.exports = router;
