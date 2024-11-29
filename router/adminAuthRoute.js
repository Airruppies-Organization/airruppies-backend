const express = require("express");
const {
  createAdmin,
  login,
  sendToken,
  verifyToken,
  resetPassword,
} = require("../controllers/adminControllers");
const router = express.Router();

router.post("/createAdmin", createAdmin);
router.post("/login", login);

// router.post("/forgotpassword", sendToken);
// router.post("/verifytoken", verifyToken);
// router.put("/resetpassword", resetPassword);

module.exports = router;
