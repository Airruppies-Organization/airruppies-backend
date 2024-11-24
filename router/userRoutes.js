const express = require("express");
const { createUser, 
    login, 
    sendToken, 
    verifyToken, 
    resetPassword,
    googleAuthenticate,
    googleSignIn
} = require("../controllers/userControllers");
const router = express.Router();

router.post("/createuser", createUser);
router.post("/login", login);
router.post("/forgotpassword", sendToken);
router.post("/verifytoken", verifyToken);
router.put("/resetpassword", resetPassword);
router.post("/googleauth", googleAuthenticate);
router.post("/googlesignin", googleSignIn);




module.exports = router;
