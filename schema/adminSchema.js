const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const Merchant = require("./merchantSchema");
const encrypter = require("../lib/encrypt");

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
    status: {
      type: Boolean,
      required: true,
      default: true,
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
  // Validate input fields
  if (!firstName || !lastName || !email || !password) {
    throw new Error("All fields are required.");
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    throw new Error("Invalid email format.");
  }

  // Validate password strength
  if (!validator.isStrongPassword(password)) {
    throw new Error("The password is not strong enough.");
  }

  // Check if admin with email already exists
  const existingAdmin = await this.findOne({ email });
  if (existingAdmin) {
    throw new Error("An admin with this email already exists.");
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  let decryptedMerchantId;
  if (merchant_id) {
    // Decrypt merchant ID
    const [encryptedData, iv] = merchant_id.split("/");
    decryptedMerchantId = encrypter.decrypt({ encryptedData, iv });

    // Verify the merchant exists
    const existingMerchant = await Merchant.findById(decryptedMerchantId);
    if (!existingMerchant) {
      throw new Error(
        "Merchant does not exist. Please provide a valid merchant ID."
      );
    }
  }

  // Create admin
  const admin = await this.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    merchant_id: decryptedMerchantId || merchant_id,
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

  const admin = await this.findOne({ email, status: true });

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
        "Admin does not exist. Please provide a valid merchant ID."
      );
    }
  }

  return admin;
};

adminFormat.statics.getAdminByEmail = async function (email) {
  if (!email) throw new Error("Please provide an email");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  const admin = await this.findOne({ email });

  return admin;
};

adminFormat.statics.updatePassword = async function (email, password) {
  if (!email || !password) throw new Error("Please provide email and password");

  if (!validator.isEmail(email)) throw new Error("Invalid email");

  const admin = await this.findOne({ email });
  if (!admin) throw new Error("No admin with this email");

  const salt = await bcrypt.genSalt(10);
  const hash_password = await bcrypt.hash(password, salt);

  admin.password = hash_password;
  await admin.save();

  return admin;
};

adminFormat.statics.deactivate = async function (merchant_id) {
  if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
    throw new Error("Invalid merchant ID");
  }
  console.log("merchant_id:", merchant_id);

  const deactivatedAdmin = await this.findOne({ merchant_id });
  console.log(deactivatedAdmin);

  if (!deactivatedAdmin) {
    throw new Error("Admin does not exist");
  } else {
    deactivatedAdmin.status = false;
    await deactivatedAdmin.save();
  }

  return "Merchant deactivated successfully";
};

module.exports = mongoose.model("Admin", adminFormat, "admin");
