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
    emailVerified: {
      type: Boolean,
      default: false,
    },
    authType: {
      type: String,
      default: "local",
    },
    pin: {
      type: Number, 
      default: 1111,
    },
    pinSet: {
      type: Boolean,
      default: false
    }
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
    authType: "local",
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

  if (user.authType != "local") {
    throw new Error("User cannot sign in with this method");
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
};

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
};

userFormat.statics.thirdPartyAuth = async function (email, phoneNumber) {
  if (!email || !phoneNumber)
    throw new Error("Please provide email and phone number");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  if (!validator.isMobilePhone(phoneNumber))
    throw new Error("Invalid phone number");

  const user = await this.findOne({ email });

  if (user) throw new Error("User already exists");
  const username = email.split("@")[0];
  const password = `${username}1234`;
  const emailVerified = true;

  const newUser = await this.create({
    email,
    phoneNumber,
    username,
    password,
    emailVerified,
    authType: "google",
  });

  return newUser;
};

userFormat.statics.thirdPartySignIn = async function (email) {
  if (!email) throw new Error("Please provide email");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  const user = await this.findOne({ email });

  if (!user) throw new Error("User does not exist");

  if (user.authType == "local")
    throw new Error("User cannot sign in with this method");

  return user;
};

userFormat.statics.updateProfile = async function (
  username,
  email,
  phoneNumber,
  user_id
) {
  if (!validator.isEmail(email)) {
    throw new Error("Invalid Email format");
  }

  if (!validator.isMobilePhone(phoneNumber)) {
    throw new Error("Invalid phone number");
  }

  const user = await this.findById(user_id);

  if (!user) {
    throw new Error("User does not exist");
  }

  user.email = email;
  user.phoneNumber = phoneNumber;
  user.username = username;
  await user.save();

  return user;
};


userFormat.statics.updatePin = async (
  user_id,
  pin
) => {
  const user = await this.findById(user_id);

  if (!user) {
    throw new Error("User does not exist");
  }

  user.pin = pin;
  user.pinSet = true;
  await user.save()

  return user
}

userFormat.statics.authorizeTransaction = async (
  user_id,
  pin
) => {
  const user = await this.findById(user_id);

  if (!user) {
    throw new Error("User does not exist");
  }

  if (!user.pinSet) throw new Error("Please setup your pin");

  if (user.pin != pin) return false;

  return true
}

module.exports = mongoose.model("User", userFormat, "users");
