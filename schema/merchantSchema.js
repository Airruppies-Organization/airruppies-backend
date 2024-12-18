const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { dashboardFormat } = require("./schema");
const encrypter = require("../lib/encrypt");

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
    lng: {
      type: Number,
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    encryptedMerchId: {
      type: {
        encryptedData: { type: String },
        iv: { type: String },
      },
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
  admin_id,
  lng,
  lat
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate input
    if (!name || !state || !address || !logo) {
      throw new Error("All fields must be filled");
    }
    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      throw new Error("Invalid admin ID");
    }

    const Admin = mongoose.model("Admin");

    // Check if admin exists
    const admin = await Admin.findById(admin_id).session(session);
    if (!admin) {
      throw new Error("Admin not found");
    }

    // Create a new merchant
    const [merchant] = await this.create(
      [
        {
          name,
          state,
          address,
          logo,
          admins: [admin_id], // Start with the initial admin
          lat,
          lng,
          encryptedMerchId: {},
        },
      ],
      { session }
    );

    const merchantIdString = merchant._id.toString();
    const encrypted = encrypter.encrypt(merchantIdString);
    merchant.encryptedMerchId = encrypted;
    await merchant.save({ session });
    // Update the admin with the new merchant_id
    if (!admin.merchant_id) {
      admin.merchant_id = merchant._id;
      await admin.save({ session });
    }

    await dashboardFormat.create(
      [
        {
          totalSales: 0,
          totalMonthlySales: 0,
          totalMonthlyTrans: 0,
          totalTrans: 0,
          monthlySales: [],
          monthlyTrans: [],
          merchant_id: merchant._id,
        },
      ],

      { session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return merchant;
  } catch (error) {
    // Rollback the transaction on failure
    await session.abortTransaction();
    session.endSession();

    // Log and rethrow the error
    console.error("Error onboarding merchant:", error);
    throw error;
  }
};

merchantFormat.statics.getMerchantById = async function (id) {
  if (!id) throw new Error("Please provide a merchant ID");

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Invalid merchant ID");

  const merchant = await this.findById(id);
  return merchant;
};

merchantFormat.statics.allMerchants = async function () {
  try {
    const merchants = await this.find({ status: true });
    return merchants.map((merchant) => {
      return {
        id: merchant._id,
        name: merchant.name,
        address: merchant.address,
        lng: merchant.lng,
        lat: merchant.lat,
      };
    });
  } catch (error) {
    console.error("Error getting all merchants:", error);
    throw error;
  }
};

module.exports = mongoose.model("Merchant", merchantFormat, "merchants");
