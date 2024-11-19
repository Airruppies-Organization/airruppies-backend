const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const User = require("../schema/userSchema");
const mongoose = require("mongoose");
const { sessionFormat } = require("../schema/schema");

router.get("/sessionData", async (req, res) => {
  // come back to this
  try {
    const { code } = req.query;

    const result = await sessionFormat.findOne({ code });

    if (!result) {
      return res.status(404).json({ message: "Invalid code" });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
