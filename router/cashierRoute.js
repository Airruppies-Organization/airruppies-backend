const express = require("express");
const { login, getBill, resetPassword, sendToken } = require("../controllers/cashierControllers");
const router = express.Router();
const cashierAuth = require("../middleware/cashierAuth");


router.post("/login", login);
router.post("/getbill", cashierAuth, getBill);
router.post("/resetpassword", resetPassword);
router.post("/sendtoken", sendToken);


module.exports = router;
