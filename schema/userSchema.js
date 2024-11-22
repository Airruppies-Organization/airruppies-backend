const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const Schema = mongoose.Schema;

const userFormat = new Schema(
  {
    username: {
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
      required: true,
    },
  },
  { timestamps: true }
);

userFormat.statics.signup = async function (
  username,
  email,
  phoneNumber,
  password
) {
  if (!username || !email || !phoneNumber || !password) {
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
    throw new Error("A user with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hash_password = await bcrypt.hash(password, salt);

  const user = await this.create({
    username,
    email,
    phoneNumber,
    password: hash_password,
  });

  return user;
};

userFormat.statics.login = async function (email, password) {
  if (!email || !password) {
    throw new Error("Please fill all fields");
  }

  if (!validator.isEmail(email)) {
    throw new Error("invalid email");
  }

  const user = await this.findOne({ email });
  if (!user) {
    throw new Error("invalid email or password combination");
  }

  const decod_password = await bcrypt.compare(password, user.password);

  if (!decod_password) {
    throw new Error("invalid email or password combination");
  }

  return user;
};

userFormat.statics.getUserByEmail = async function (email) {
  if (!email) throw new Error("Please provide an email");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  const user = await this.findOne({ email });
  if (!user) throw new Error("No user with this email");

  return user;
}

userFormat.statics.updatePassword = async function (email, password) {
  if (!email || !password) throw new Error("Please provide email and password");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  const user = await this.findOne({ email });
  if (!user) throw new Error("No user with this email");

  const salt = await bcrypt.genSalt(10);
  const hash_password = await bcrypt.hash(password, salt);

  user.password = hash_password;
  await user.save();

  return user;
}

module.exports = mongoose.model("User", userFormat, "users");
