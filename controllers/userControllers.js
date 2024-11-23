const User = require("../schema/userSchema");
const jwt = require("jsonwebtoken");
const mailer = require("../lib/mailer");
const otp = require("../lib/otp");
const redisClient = require("../lib/redis");

const createToken = (_id) => {
  const token = jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: "3d" });
  return token;
};

const createUser = async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;

  try {
    const user = await User.signup(username, email, phoneNumber, password);
    const token = createToken(user._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const sendToken = async(req, res) => {
  const { email } = req.body;

  try {
    const user = await User.getUserByEmail(email);
    if (user)
    {
      const otpcode = otp(7);
      console.log(otpcode);
      const message = `Please use this OTP ${otpcode} to verify your email`;
      redisClient.set(email, otpcode, 3600);
      mailer.sendEmail('donotreply', email, message, 'Password Reset')
      return res.status(200).json({ message: 'OTP sent' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }

}

const verifyToken = async(req, res) => {
  const { email, otpcode } = req.body;

  try {
    const token = await redisClient.get(email);
    if (token === otpcode)
    {
      res.status(200).json({ message: 'OTP verified' });
    }
    else
    {
      res.status(400).json({ message: 'OTP not verified' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

const resetPassword = async(req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.updatePassword(email, password);
    res.status(200).json({ message: 'Password updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const googleSignUp = async(req, res) => {

};

module.exports = { createUser, login, sendToken, verifyToken, resetPassword };
