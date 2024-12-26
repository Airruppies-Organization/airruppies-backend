const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

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

  if (!validator.isEmail(email)) {
    throw new Error("invalid email");
  }

  const cashier = await this.findOne({ badge_id });
  if (!cashier) {
    throw new Error("invalid email or password combination");
  }

  const decod_password = await bcrypt.compare(password, admin.password);

  if (!decod_password) {
    throw new Error("invalid email or password combination");
  }

  return cashier;
};

cashierFormat.statics.getCashierByEmail = async function (email) {
  if (!email) throw new Error("Please provide an email");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  const cashier = await this.findOne({ email });
  if (!cashier) throw new Error("No cashier with this email");

  return cashier;
};

cashierFormat.statics.updatePassword = async function (email, password) {
  if (!email || !password) throw new Error("Please provide email and password");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  const cashier = await this.findOne({ email});
  if (!user) throw new Error("No user with this email");

  const salt = await bcrypt.genSalt(10);
  const hash_password = await bcrypt.hash(password, salt);

  cashier.password = hash_password;
  await cashier.save();

  return cashier;
};

module.exports = mongoose.model("Cashier", cashierFormat, "cashier");
