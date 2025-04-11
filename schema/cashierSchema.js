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
      validate: {
        validator: validator.isEmail,
        message: "Invalid email",
      },
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: validator.isMobilePhone,
        message: "Invalid phone number",
      },
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
    },
    logged_in: {
      type: Boolean,
      required: true,
      default: false,
    },
    logged_in: {
      type: Boolean,
      required: true,
    }
  },
  { timestamps: true }
);

// Remove the indexing part to avoid MongoDB enforcing uniqueness
// cashierFormat.index({ merchant_id: 1, email: 1 }, { unique: true });
// cashierFormat.index({ merchant_id: 1, badge_id: 1 }, { unique: true });

cashierFormat.statics.signup = async function (
  fullName,
  email,
  phoneNumber,
  badge_id,
  merchant_id
) {
  // Validate input fields
  if (!fullName || !email || !badge_id || !merchant_id || !phoneNumber) {
    throw new Error("All fields are required");
  }

  if (!validator.isEmail(email)) {
    throw new Error("Invalid email");
  }

  if (!validator.isMobilePhone(phoneNumber)) {
    throw new Error("Invalid phone number");
  }

  // Manually check if a cashier already exists with the same email and merchant_id
  const existingCashierByEmail = await this.findOne({ email, merchant_id });
  if (existingCashierByEmail) {
    throw new Error(
      "A cashier with this email already exists for this merchant"
    );
  }

  // Optionally, you could check for badge_id uniqueness for a given merchant if required
  const existingCashierByBadgeId = await this.findOne({
    badge_id,
    merchant_id,
  });
  if (existingCashierByBadgeId) {
    throw new Error(
      "A cashier with this badge ID already exists for this merchant"
    );
  }

  // Create the new cashier
  const cashier = await this.create({
    fullName,
    email,
    phoneNumber,
    badge_id,
    merchant_id,
    password: "",
    status: false,
  });

  return cashier;
};

cashierFormat.statics.login = async function (badge_id, password) {
  if (!badge_id || !password) {
    throw new Error("Please fill all fields");
  }

  const cashier = await this.findOne({ badge_id });
  if (!cashier) {
    throw new Error("Invalid email or password combination");
  }

  const decoded_password = await bcrypt.compare(password, cashier.password);

  if (!decoded_password) {
    throw new Error("Invalid email or password combination");
  }

  cashier.logged_in = true;
  await cashier.save();

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

  const cashier = await this.findOne({ email });
  if (!cashier) throw new Error("No user with this email");

  const salt = await bcrypt.genSalt(10);
  const hash_password = await bcrypt.hash(password, salt);

  cashier.password = hash_password;
  await cashier.save();

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

cashierFormat.statics.logout = async function (merchant_id) {
  const cashier = await this.findOne({ merchant_id });

  if (!cashier) return false;

  cashier.logged_in = false;
  await cashier.save();

  return true;
};

cashierFormat.statics.removeCashier = async function (merchant_id, cashier_id) {
  if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
    throw new Error("Invalid Merchant_ID");
  }

  if (!mongoose.Types.ObjectId.isValid(cashier_id)) {
    throw new Error("Invalid Cashier_ID");
  }

  const cashier = await this.findOneAndDelete({ _id: cashier_id, merchant_id });

  if (!cashier) {
    throw new Error("Cashier does not exist");
  }

  return cashier;
};

cashierFormat.statics.getCashierOnline = async (merchant_id) => {
  if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
    throw new Error("Invalid Merchant_ID");
  }

  const cashiers = await this.find({
    merchant_id,
    logged_in: true
  });

  return cashiers;
}

module.exports = mongoose.model("Cashier", cashierFormat, "cashier");
