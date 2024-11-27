const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Merchant = require("./merchantSchema");

const Schema = mongoose.Schema;

const adminFormat = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    merchant_id: {
      type: String,
    },
  },
  { timestamps: true }
);

adminFormat.statics.signup = async function (
  firstName,
  lastName,
  email,
  password,
  merchant_id
) {
  if (!firstName || !lastName || !email || !password) {
    throw new Error("all fields not filled");
  }

  if (!validator.isEmail(email)) {
    throw new Error("invalid email");
  }

  if (!validator.isStrongPassword(password)) {
    throw new Error("This password is not strong enough");
  }

  const exist = await this.findOne({ email });

  if (exist) {
    throw new Error("An admin with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hash_password = await bcrypt.hash(password, salt);

  if (merchant_id) {
    const existingMerchant = await Merchant.findById(merchant_id);
    if (!existingMerchant) {
      throw new Error(
        "Merchant does not exist. Please provide a valid merchant ID."
      );
    }
  }

  const admin = await this.create({
    firstName,
    lastName,
    email,
    password: hash_password,
    merchant_id,
  });

  return admin;
};

adminFormat.statics.login = async function (email, password) {
  if (!email || !password) {
    throw new Error("Please fill all fields");
  }

  if (!validator.isEmail(email)) {
    throw new Error("invalid email");
  }

  const admin = await this.findOne({ email });
  if (!admin) {
    throw new Error("invalid email or password combination");
  }

  const decod_password = await bcrypt.compare(password, admin.password);

  if (!decod_password) {
    throw new Error("invalid email or password combination");
  }

  if (admin.merchant_id) {
    const existingMerchant = await Merchant.findById(admin.merchant_id);
    if (!existingMerchant) {
      throw new Error(
        "Merchant does not exist. Please provide a valid merchant ID."
      );
    }
  }

  return admin;
};

// userFormat.statics.getUserByEmail = async function (email) {
//   if (!email) throw new Error("Please provide an email");

//   if (!validator.isEmail(email)) throw new Error("Invalid email");

//   const user = await this.findOne({ email });
//   if (!user) throw new Error("No user with this email");

//   return user;
// };

// userFormat.statics.updatePassword = async function (email, password) {
//   if (!email || !password) throw new Error("Please provide email and password");

//   if (!validator.isEmail(email)) throw new Error("Invalid email");

//   const user = await this.findOne({ email });
//   if (!user) throw new Error("No user with this email");

//   const salt = await bcrypt.genSalt(10);
//   const hash_password = await bcrypt.hash(password, salt);

//   user.password = hash_password;
//   await user.save();

//   return user;
// };

module.exports = mongoose.model("Admin", adminFormat, "admin");
