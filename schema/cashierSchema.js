const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Merchant = require("./merchantSchema");

const Schema = mongoose.Schema;

const cashierFormat = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    merchant_id: {
      type: String,
      required: true,
    },
    badge_id: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

cashierFormat.statics.signup = async function (
  fullName,
  email,
  phoneNumber,
  badge_id,
  merchant_id
) {
  if (!fullName || !email || !badge_id || !merchant_id || !phoneNumber) {
    throw new Error("all fields not filled");
  }

  if (!validator.isEmail(email)) {
    throw new Error("invalid email");
  }

  const exist = await this.findOne({ badge_id, email });

  if (exist) {
    throw new Error("An cashier with this email and badgeId already exists");
  }

  const cashier = await this.create({
    fullName,
    email,
    phoneNumber,
    badge_id,
    merchant_id,
    password: "",
  });

  return cashier;
};

cashierFormat.statics.login = async function (badge_id, password) {
  if (!badge_id || !password) {
    throw new Error("Please fill all fields");
  }

  const cashier = await this.findOne({ badge_id });
  if (!cashier) {
    throw new Error("invalid email or password combination");
  }

  const decod_password = await bcrypt.compare(password, cashier.password);

  if (!decod_password) {
    throw new Error("invalid email or password combination");
  }

  //   if (admin.merchant_id) {
  //     const existingMerchant = await Merchant.findById(admin.merchant_id);
  //     if (!existingMerchant) {
  //       throw new Error(
  //         "Merchant does not exist. Please provide a valid merchant ID."
  //       );
  //     }
  //   }

  return cashier;
};

cashierFormat.statics.setPassword = async function (badge_id, password) {
  if (!badge_id || !password) {
    throw new Error("All fields required");
  }

  const cashier = await this.findOne({ badge_id });
  if (!cashier) {
    throw new Error("No cashier with this badge ID");
  }

  if (cashier.password) {
    throw new Error("You already have a password");
  }

  const salt = await bcrypt.genSalt(10);
  const hash_password = await bcrypt.hash(password, salt);

  cashier.password = hash_password;
  await cashier.save();

  return cashier;
};

module.exports = mongoose.model("Cashier", cashierFormat, "cashier");
