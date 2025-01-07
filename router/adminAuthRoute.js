const express = require("express");
const {
  createAdmin,
  login,
  sendToken,
  resetPassword,
} = require("../controllers/adminControllers");
const router = express.Router();
const adminRequireAuth = require("../middleware/adminRequireAuth");


router.post("/createAdmin", adminRequireAuth, createAdmin);
router.post("/login", login);
router.post("/forgotpassword", sendToken);
router.put("/resetpassword", resetPassword);

module.exports = router;
