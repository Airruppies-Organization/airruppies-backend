const express = require("express");
const router = express.Router();
const Cashier = require("../schema/adminSchema");
const jwt = require("jsonwebtoken");
const mailer = require("../lib/mailer");
const otp = require("../lib/otp");
const redisClient = require("../lib/redis");
const mongoose = require("mongoose");
const adminRequireAuth = require("../middleware/adminRequireAuth");
const Order = require("../schema/orderSchema");
const Session = require("../schema/sessionSchema");


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

const getBill = async (req, res) => {
  const { merchant_id, bill_code } = req.body;

  try{
      const bills = await Session.aggregate([
          {
              $match: { bill_code, merchant_id }
          },
          {
              $lookup: {
                  from: "bills",
                  localField: "bill_code",
                  foreignField: "bill_code",
                  as: "bills"
              }
          }
      ])
      .then((response)=>{
          response[0].orders = response[0].orders.map(async (order) => {
              return await Order.find({_id: order});
          });
      }, error => {throw new Error(error)});

      res.status(200).json(bills);
  }catch(error){
      res.status(400).json({ error: error.message });
  }
}

const sendToken = async (req, res) => {
  const { email } = req.body;

  try {
    const cashier = await Cashier.getCashierByEmail(email);
    if (cashier) {
      const otpcode = otp(7);
      console.log(otpcode);
      const message = `Please use this OTP ${otpcode} to verify your email`;
      redisClient.set(email, otpcode, 3600);
      mailer.sendEmail("donotreply", email, message, "Password Reset");
      return res.status(200).json({ message: "OTP sent" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const cashier = await Cashier.updatePassword(email, password);
    res.status(200).json({ cashier, message: "Password updated" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// const googleSignUp = async (req, res) => {};

module.exports = { login, getBill, resetPassword, sendToken };
// module.exports = { createUser, login, sendToken, verifyToken, resetPassword };
