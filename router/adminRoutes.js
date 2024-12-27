const express = require("express");
const {
  createAdmin,
  login,
  sendToken,
  resetPassword,
} = require("../controllers/adminControllers");
const router = express.Router();

router.post("/createAdmin", createAdmin);
router.post("/login", login);
router.post("/forgotpassword", sendToken);
router.put("/resetpassword", resetPassword);

module.exports = router;
