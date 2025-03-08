const User = require("../schema/userSchema");
const Merchant = require("../schema/merchantSchema");
const jwt = require("jsonwebtoken");
const mailer = require("../lib/mailer");
const Otp = require("../schema/otpSchema");
const otp = require("../lib/otp");
const redisClient = require("../lib/redis");

const createToken = (_id) => {
  const token = jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: "2d" });
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
    const profile = await User.aggregate([
      {
        $match: { _id: user._id },
      },
      {
        $project: {
          password: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: "carts",
          localField: "_id",
          foreignField: "user_id",
          as: "carts",
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user_id",
          as: "orders",
        },
      },
    ]).then(
      (response) => {
        return response;
      },
      (error) => {
        throw new Error(error);
      }
    );

    res.status(200).json({ profile, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const profile = async (req, res) => {
  const { _id } = req.user;

  try {
    const profile = await User.aggregate([
      {
        $match: { _id },
      },
      {
        $project: {
          password: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: "carts",
          localField: "_id",
          foreignField: "user_id",
          as: "cart_items",
        },
      },
      {
        $lookup: {
          from: "bills",
          localField: "_id",
          foreignField: "user_id",
          as: "orders",
        },
      },
    ]);

    res.status(200).json({ profile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const sendToken = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.getUserByEmail(email);
    if (user) {
      const otpcode = otp(7);
      const message = `Please use this OTP ${otpcode} to verify your email`;
      const expiredTime = Date.now() + 3 * 60 * 1000;
      await Otp.createCode(email, otpcode, expiredTime);

      mailer.sendEmail("donotreply", email, message, "Password Reset");

      res.status(200).json({ message: "OTP sent" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyToken = async (req, res) => {
  const { email, otpcode } = req.body;

  try {
    const isVerified = await Otp.verifyCode(email, otpcode);

    if (isVerified) {
      res.status(200).json({ message: "OTP verified" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    await User.updatePassword(email, password);
    res.status(200).json({ message: "Password updated" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const googleAuthenticate = async (req, res) => {
  try {
    const { email, profile } = req.body;

    const user = await User.getUserByEmail(email);

    if (user) {
      throw new Error("User already exists");
    }

    const newUser = await User.thirdPartyAuth(email, profile.phoneNumber);
    const token = createToken(newUser._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const googleSignIn = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.thirdPartySignIn(email);
    const token = createToken(user._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const paymentTypes = async (req, res) => {
  const { merchant_id } = req.query;

  try {
    const merchantPaymentTypes = await Merchant.getPaymentType(merchant_id);
    res.status(200).json({ merchantPaymentTypes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { username, phoneNumber, email } = req.body;
  const user_id = req.user._id;

  try {
    const newProfile = await User.updateProfile(
      username,
      email,
      phoneNumber,
      user_id
    );

    res.status(200).json({ newProfile });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const setPinCode = async (req, res) => {
  const { pin } = req.body;
  const user_id = req.user_id;

  try {

    if (pin == "") throw new Error("Pin Field is required");

    const userProfile = await User.updatePin(user_id, pin);

    res.status(200).json({ message: "Pin is set successfully!", user: userProfile })

  }catch(err) {
    res.status(400).json({error : err.message})
  }
}

const authorizePayment = async (req, res) => {
  const { pin } = req.body;
  const user_id = req.user_id;

  try {

    if (pin == "") throw new Error("Pin Field is required");

    const authorize = await User.authorizeTransaction(user_id, pin);

    if (!authorize) return res.status(200).json({message: "Pin is invalid"});

    return res.status(200).json({ message: "Payment Authorized Successfully!"})

  }catch(err) {
    res.status(400).json({error : err.message})
  }
}

const verifyAddress = async (req, res) => {
  const { addressFile } = req.body;
}


module.exports = {
  createUser,
  login,
  sendToken,
  verifyToken,
  resetPassword,
  googleAuthenticate,
  googleSignIn,
  profile,
  paymentTypes,
  updateProfile,
  setPinCode,
  authorizePayment
};



/**
 *  TO DO LIST
 * 
 *  PIN SETUP
 *  KYC VERIFICATION 
 * 
 * 
 */
