const Admin = require("../schema/adminSchema");
const jwt = require("jsonwebtoken");
const mailer = require("../lib/mailer");
const otp = require("../lib/otp");
const redisClient = require("../lib/redis");
const mongoose = require("mongoose");

const createToken = (_id) => {
  const token = jwt.sign({ _id }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: "2d",
  });
  return token;
};

const createAdmin = async (req, res) => {
  const { firstName, lastName, email, password, merchant_id } = req.body;

  try {
    const admin = await Admin.signup(
      firstName,
      lastName,
      email,
      password,
      merchant_id
    );

    const token = createToken(admin._id);

    // Set HTTP-only cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: true,
      maxAge: 2 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000, // 1 hour before 2days
      sameSite: "None",
    });

    const hasMerch = admin.merchant_id ? true : false;

    if (hasMerch) {
      res.status(200).json({
        success: true,
        hasMerch: true,
        adminName: `${admin.firstName} ${admin.lastName}`,
      });
    } else {
      res.status(200).json({ success: true, hasMerch: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.login(email, password);
    const token = createToken(admin._id);

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: true,
      maxAge: 2 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000, // 1 hour before 2days
      sameSite: "None",
    });

    const hasMerch = admin.merchant_id ? true : false;

    if (hasMerch) {
      res.status(200).json({ success: true, hasMerch: true });
    } else {
      res.status(200).json({ success: true, hasMerch: false });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const sendToken = async (req, res) => {
  const { email } = req.body;

  try {
    const admin = await Admin.getAdminByEmail(email);
    if (admin) {
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
    const admin = await Admin.updatePassword(email, password);
    res.status(200).json({ admin, message: "Password updated" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// const googleSignUp = async (req, res) => {};

module.exports = { createAdmin, login, sendToken, resetPassword };
