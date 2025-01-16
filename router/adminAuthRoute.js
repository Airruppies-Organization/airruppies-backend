const express = require("express");
const {
  createAdmin,
  login,
  sendToken,
  resetPassword,
  verifyToken
} = require("../controllers/adminControllers");
const router = express.Router();
// const adminRequireAuth = require("../middleware/adminRequireAuth");

router.post("/createAdmin", createAdmin);
router.post("/login", login);
router.post("/forgotpassword", sendToken);
router.put("/resetpassword", resetPassword);
router.get("/verifyToken", verifyToken);

module.exports = router;
