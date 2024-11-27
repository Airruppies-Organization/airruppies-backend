const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

// Import the Admin model AFTER the schema definition if needed
// const Admin = require("./adminSchema"); // Ensure this import is correct and the file exists

const Schema = mongoose.Schema;

const merchantFormat = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    admins: [String], // Array of admin IDs
  },
  { timestamps: true }
);

merchantFormat.statics.onboard = async function (
  name,
  state,
  address,
  logo,
  admin_id
) {
  // Ensure the admin_id is a valid ObjectId and the fields are filled
  if (!name || !state || !address || !logo) {
    throw new Error("All fields must be filled");
  }

  // Create a new merchant document
  const merchant = await this.create({
    name,
    state,
    address,
    logo,
    admins: [admin_id], // Start with the initial admin
  });

  const Admin = mongoose.model("Admin");

  // Ensure the admin exists before linking
  const admin = await Admin.findById(admin_id);

  if (admin) {
    // Update the admin document with the new merchant_id
    admin.merchant_id = merchant._id;
    await admin.save();
  } else {
    throw new Error("Admin not found");
  }

  return merchant;
};

module.exports = mongoose.model("Merchant", merchantFormat, "merchants");
