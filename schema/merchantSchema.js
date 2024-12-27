const mongoose = require("mongoose");
const { dashboardFormat } = require("./schema");

// Import the Admin model AFTER the schema definition if needed
// const Admin = require("./adminSchema"); // Ensure this import is correct and the file exists

const Schema = mongoose.Schema;

const merchantFormat = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    city: {
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
        type: String,
        required: true,
    },
    lat: {
        type: String,
        required: true,
    },
    status: {
      type: Boolean,
      default: true
    },
    encryptedMerchId: {
      type: {
        encryptedData: { type: String },
        iv: { type: String },
      },
    },
    refPrefix: {
      type: String,
      default: "ARP"
    },
    admins: [String], // Array of admin IDs
    paymentTypes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "PaymentType",
    }, // Array of payment type IDs
    api_url: {
      type: String,
    },
    merchant_product_name: {
      type: String,
    },
    merchant_product_price: {
      type: String,
    }
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
    if (!name || !state || !address || !logo || !admin_id || !lng || !lat) {
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
          lng
        },
      ],
      { session }
    );

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

  //Find the merchant
  const merchant = await this.findOne({
    "encryptedMerchId.encryptedData": id
  });

  if (!merchant) throw new Error("Merchant not found");

  return merchant;
}

merchantFormat.statics.allMerchants = async function(){
  try {
    const merchants = await this.find({status: true});
    return merchants.map(merchant => {
      return {
        id: merchant.encryptedMerchId.encryptedData,
        name: merchant.name,
        address: merchant.address,
        lng: merchant.lng,
        lat: merchant.lat
      };
    });
  } catch (error) {
    console.error("Error getting all merchants:", error);
    throw error;
  }
};


merchantFormat.statics.addPaymentType = async function (merchant_id, paymentTypes) {
  if (!merchant_id || paymentTypes.length === 0) {
    throw new Error("Merchant ID and Payment Type ID are required");
  }

  if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
    throw new Error("Invalid merchant ID");
  }

  if (!mongoose.Types.Array.isValid(paymentTypes)) {
    throw new Error("Payment Types must be an array");
  }

  paymentTypes.forEach((payment) => {
    if (!mongoose.Types.ObjectId.isValid(payment)) throw new Error("Invalid payment Id");
  });

  const merchant = await this.findById(merchant_id);
  if (!merchant) {
    throw new Error("Merchant not found");
  }
  
  merchant.paymentTypes = paymentTypes;
  return await merchant.save();
}

merchantFormat.statics.getPaymentType = async function (merchant_id) {
  if (!merchant_id) {
    throw new Error("Merchant ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
    throw new Error("Invalid merchant ID");
  }

  const merchant = await this.findById(merchant_id);
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  const paymentTypes = await mongoose.model("PaymentType").find({
    _id: { $in: merchant.paymentTypes },
  });


  return paymentTypes;
}

merchantFormat.statics.updateMerchant = async function (merchant_id, data) {
  if (!merchant_id || !data) {
    throw new Error("Merchant ID and data are required");
  }

  if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
    throw new Error("Invalid merchant ID");
  }

  const merchant = await this.getMerchantById(merchant_id);
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  Object.keys(data).forEach((key) => {
    merchant[key] = data[key];
  });

  return await merchant.save();
}

merchantFormat.statics.configureApiSettings = async function (merchant_id, merchant_product_name, merchant_product_price, api_url) {
  if (!merchant_id || !merchant_product_name || !merchant_product_price || !api_url) {
    throw new Error("Merchant ID, Product Name, Product Price, and API URL are required");
  }

  if (!mongoose.Types.ObjectId.isValid(merchant_id)) {
    throw new Error("Invalid merchant ID");
  }

  const merchant = await this.getMerchantById(merchant_id);
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  merchant.merchant_product_name = merchant_product_name;
  merchant.merchant_product_price = merchant_product_price;
  merchant.api_url = api_url;

  return await merchant.save();

}


module.exports = mongoose.model("Merchant", merchantFormat, "merchants");
