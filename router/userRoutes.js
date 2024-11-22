const express = require("express");
const { createUser, login, sendToken, verifyToken, resetPassword } = require("../controllers/userControllers");
const router = express.Router();

router.post("/createuser", createUser);
router.post("/login", login);
router.post("/forgotpassword", sendToken);
router.post("/verifytoken", verifyToken);
router.post("/resetpassword", resetPassword);


module.exports = router;
