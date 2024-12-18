const express = require("express");
const router = express.Router();
const Cashier = require("../schema/cashierSchema");
const jwt = require("jsonwebtoken");
const mailer = require("../lib/mailer");
const otp = require("../lib/otp");
const redisClient = require("../lib/redis");
const mongoose = require("mongoose");
const adminRequireAuth = require("../middleware/adminRequireAuth");

const createToken = (_id) => {
  const token = jwt.sign({ _id }, process.env.CASHIER_JWT_SECRET, {
    expiresIn: "2d",
  });
  return token;
};

const login = async (req, res) => {
  const { badge_id, password } = req.body;
  try {
    const cashier = await Cashier.login(badge_id, password);
    const token = createToken(cashier._id);
    res.status(200).json({ badge_id, token }); // supposed to be email, token and an id for that particular business
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createPassword = async (req, res) => {
  const { badge_id, password } = req.body;

  try {
    const cashier = await Cashier.setPassword(badge_id, password);
    const token = createToken(cashier._id);
    res.status(200).json({ badge_id, token }); // supposed to be email, token and an id for that particular business
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { login, createPassword };
// module.exports = { createUser, login, sendToken, verifyToken, resetPassword };
