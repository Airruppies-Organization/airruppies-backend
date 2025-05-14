// Description: It has all the functions related to merchant.
const Merchant = require("../schema/merchantSchema");
const Admin = require("../schema/adminSchema");
const mailer = require("../lib/mailer");
const jwt = require("jsonwebtoken");
const Cashier = require("../schema/cashierSchema");
const paymentType = require("../schema/paymentTypeSchema");

const { dashboardFormat } = require("../schema/schema");
const salesFormat = require("../schema/salesSchema");
const encrypter = require("../lib/encrypt");

const PayoutAccount = require("../schema/payoutAccountSchema");


const { validateBody } = require("../lib/validator");


require("dotenv").config();

const createToken = (_id) => {
  const token = jwt.sign({ _id }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: "2d",
  });
  return token;
};

const onboard = async (req, res) => {
  const { name, state, address, logo, lng, lat } = req.body;

  const admin_id = req.admin._id;

  try {
    const merchant = await Merchant.onboard(
      name,
      state,
      address,
      logo,
      admin_id,
      lng,
      lat
    );

    res.status(200).json({ merchant });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

const getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.allMerchants();
    return res.status(200).json(merchants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const inviteNewAdmin = async (req, res) => {
  const merchant_id = req.admin.merchant_id;
  const { email } = req.body;

  try {
    // Verify the Email
    const admin = await Admin.getAdminByEmail(email);
    if (admin) {
      throw new Error("Admin already exists");
    }

    //Get the Merchant
    // const merchant = await Merchant.getMerchantById(merchant_id);

    // encrypt the merchant_id
    const encryptedMerchantId = encrypter.encrypt(merchant_id);

    // Invite the Admin
    const message = `You have been invited to be an admin of a merchant. Click on this link to accept the invite: http://localhost:3000/admin/auth/signup?invite=${encryptedMerchantId.encryptedData}/${encryptedMerchantId.iv}`;
    mailer.sendEmail("donotreply", email, message, "Admin Invite");

    return res.status(200).json({ message: "Admin invited" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const addNewAdmin = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const { encryptedData, iv } = req.params;

  try {
    if (!encryptedData || !iv) {
      throw new Error("Invalid link");
    }

    if (!firstName || !lastName || !email || !password) {
      throw new Error("All fields not filled");
    }

    if (!validator.isEmail(email)) {
      throw new Error("Invalid email");
    }

    if (!validator.isStrongPassword(password)) {
      throw new Error("This password is not strong enough");
    }

    // Decrypt the merchant_id
    const encryption = { encryptedData, iv };

    // Check if the merchant exists
    const merchant = await Merchant.getMerchantById(encryption.encryptedData);
    if (!merchant) {
      throw new Error("Merchant does not exist");
    }

    // Create the Admin
    const admin = await Admin.signup(
      firstName,
      lastName,
      email,
      password,
      merchant._id
    );
    const token = createToken(admin._id);
    const hasMerch = true;
    const adminEmail = admin.email;

    return res.status(200).json({ adminEmail, token, hasMerch });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getMerchant = async (req, res) => {
  const { merchant_id } = req.params;

  try {
    const merchant = await Merchant.getMerchantById(merchant_id);
    return res.status(200).json(merchant);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const createCashier = async (req, res) => {
  const { fullName, email, phoneNumber, badge_id } = req.body;
  const merchant_id = req.admin.merchant_id;

  try {
    const result = await Cashier.signup(
      fullName,
      email,
      phoneNumber,
      badge_id,
      merchant_id
    );

    res.status(200).json(result); // supposed to be email, token, and an id for that particular business
  } catch (error) {
    console.log(error.message);

    res.status(400).json({ error: error.message });
  }
};

const removeCashier = async (req, res) => {
  const merchant_id = req.admin.merchant_id;
  const cashier_id = req.params._id;

  console.log(cashier_id);

  try {
    const deactivatedCashier = await Cashier.removeCashier(
      merchant_id,
      cashier_id
    );

    res.status(200).json({
      message: "cashier deactivated successfully",
      deactivatedCashier,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getCashiers = async (req, res) => {
  const queries = req.query;
  const merchant_id = req.admin.merchant_id;

  const query = { merchant_id };

  if (queries.search) {
    const searchTerm = queries.search.trim();
    query.$or = [
      { fullName: { $regex: searchTerm, $options: "i" } },
      { badge_id: { $regex: searchTerm, $options: "i" } },
    ];
  }

  if (queries.cashierStatus) {
    const status = queries.cashierStatus === "true"; // Convert to boolean
    query.logged_in = status; // Add status condition directly to the query object
  }

  try {
    const cashiers = await Cashier.find(query).select(
      "fullName email phoneNumber badge_id logged_in"
    );

    res.status(200).json(cashiers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const salesData = async (req, res) => {
  const {
    id,
    code,
    method,
    status,
    total,
    data,
    sessionFormat: format,
  } = req.body;

  try {
    const result = await salesFormat.create({
      id,
      code,
      method,
      status,
      total,
      data,
      format,
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
};

const allTimeSales = async (req, res) => {
  const getTimeRange = (range) => {
    let startTime = new Date();

    switch (range) {
      case "1D":
        startTime.setHours(startTime.getHours() - 24);
        break;
      case "5D":
        startTime.setDate(startTime.getDate() - 5);
        break;
      case "1M":
        startTime.setMonth(startTime.getMonth() - 1);
        break;
      case "1Y":
        startTime.setFullYear(startTime.getFullYear() - 1);
        break;
      default:
        return null; // Invalid range
    }

    return startTime;
  };

  try {
    const { range } = req.query;

    if (!range || !["1D", "5D", "1M", "1Y"].includes(range)) {
      return res.status(400).json({
        message: "Unsupported time range. Use one of: 1D, 5D, 1M, 1Y",
      });
    }

    const merchant_id = req.admin?.merchant_id;
    if (!merchant_id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing merchant_id" });
    }

    const startTime = getTimeRange(range);
    if (!startTime) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const sales = await salesFormat.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime },
          merchant_id,
        },
      },
      {
        $project: {
          total_price: 1,
          createdAt: 1,
          truncatedTime: {
            $dateToParts: { date: "$createdAt" },
          },
        },
      },
      {
        $group: {
          _id: {
            year: "$truncatedTime.year",
            month: "$truncatedTime.month",
            day: "$truncatedTime.day",
            hour: "$truncatedTime.hour",
            minute: {
              $multiply: [
                { $floor: { $divide: ["$truncatedTime.minute", 15] } },
                15,
              ],
            },
          },
          sales: { $sum: "$total_price" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
          "_id.hour": 1,
          "_id.minute": 1,
        },
      },
      {
        $project: {
          interval: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              { $toString: "$_id.month" },
              "-",
              { $toString: "$_id.day" },
              " ",
              { $toString: "$_id.hour" },
              ":",
              { $toString: "$_id.minute" },
            ],
          },
          sales: 1,
        },
      },
    ]);

    res.status(200).json({ sales });
  } catch (err) {
    console.error("Error in /allTimeSales:", err);
    res.status(500).json({ message: err.message });
  }
};

const getSalesData = async (req, res) => {
  const queries = req.query;
  const merchant_id = req.admin.merchant_id;

  const query = { merchant_id };
  if (queries.search) {
    const searchTerm = queries.search.trim();
    query.$or = [
      ...(query.$or || []), // Preserve existing $or conditions
      { bill_code: { $regex: searchTerm, $options: "i" } },
      // { total_price: { $regex: searchTerm, $options: "i" } },
    ];
  }

  if (queries.paymentMethod) {
    const statusCondition = { payment_method: queries.paymentMethod };
    query.$or = [...(query.$or || []), statusCondition]; // Add status condition to $or
  }

  try {
    const data = await salesFormat.find(query);

    res.status(200).json(data);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ err: err.message });
  }
};

const salesSummary = async (req, res) => {
  const merchant_id = req.admin.merchant_id;

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await salesFormat.aggregate([
      {
        $facet: {
          daily: [
            {
              $match: {
                merchant_id: merchant_id,
                createdAt: { $gte: startOfDay },
              },
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$total_price" },
                transactionCount: { $count: {} },
              },
            },
          ],
          monthly: [
            {
              $match: {
                merchant_id: merchant_id,
                createdAt: { $gte: startOfMonth },
              },
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$total_price" },
                transactionCount: { $count: {} },
              },
            },
          ],
        },
      },
      {
        $project: {
          daily: { $arrayElemAt: ["$daily", 0] },
          monthly: { $arrayElemAt: ["$monthly", 0] },
        },
      },
    ]);

    const response = {
      daily: {
        totalSales: result[0]?.daily?.totalSales || 0,
        transactionCount: result[0]?.daily?.transactionCount || 0,
      },
      monthly: {
        totalSales: result[0]?.monthly?.totalSales || 0,
        transactionCount: result[0]?.monthly?.transactionCount || 0,
      },
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDashboard = async (req, res) => {
  const merchant_id = req.admin.merchant_id;

  try {
    const data = await dashboardFormat.findOne({ merchant_id });

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const saveDashboard = async (req, res) => {
  const {
    totalSales,
    totalMonthlySales,
    totalMonthlyTrans,
    transactions,
    sales,
  } = req.body;
  try {
    const dashboard = await dashboardFormat.create({
      totalSales,
      totalMonthlySales,
      totalMonthlyTrans,
      transactions,
      sales,
    });

    res.status(200).json(dashboard);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateDashboard = async (req, res) => {
  const { _id } = req.params; // Get the user ID from the URL
  const updates = req.body; // Get the updated fields from the request body

  try {
    // Find the user by ID and apply the updates
    const dashboard = await dashboardFormat.findByIdAndUpdate(_id, updates, {
      new: true,
    });

    if (!dashboard) {
      return res.status(404).json({ message: "Dashboard not found" });
    }

    // Return the updated user
    res.status(200).json(dashboard);
  } catch (err) {
    res.status(400).json({ message: "Error updating user", error: err });
  }
};

const getPaymentTypes = async (req, res) => {
  const { merchant_id } = req.admin;
  console.log(merchant_id);

  try {
    const paymentTypes = await paymentType.find({});

    const merchantPaymentTypes = await Merchant.getPaymentType(merchant_id);

    return res.status(200).json({ merchantPaymentTypes, paymentTypes });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const configureApiSettings = async (req, res) => {
  const { merchant_id } = req.admin;
  const { product_name, product_price, api_url } = req.body;

  try {
    const merchant = await Merchant.getMerchantById(merchant_id);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const settings = await Merchant.configureApiSettings(
      merchant_id,
      product_name,
      product_price,
      api_url
    );

    return res
      .status(200)
      .json({ settings, message: "API settings configured" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const setMerchantPaymentSettings = async (req, res) => {
  const { merchant_id } = req.admin;

  try {
    const merchant = await Merchant.getMerchantById(merchant_id);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const paymentTypes = req.body.paymentTypes;

    const merchantPayment = await Merchant.addPaymentType(
      merchant_id,
      paymentTypes
    );

    return res
      .status(200)
      .json({ message: "Payment settings configured", merchantPayment });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const deactiateAccount = async (req, res) => {
  const merchant_id = req.admin.merchant_id;

  try {
    const deactivate = await Admin.deactivate(merchant_id);

    // clear the cookie
    res.clearCookie("adminToken");

    res.status(200).json({ success: deactivate });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const getCashierOnShift = async (req, res) => {
  const merchant_id = req.admin.merchant_id;

  try {
    const cashiers = Cashier.getCashierOnline(merchant_id);

    res.status(200).json({cashiers})

  }catch(error) {
    res.status(400).json({ error: error.message});
  }
}

const signOut = async (req, res) => {
  // const merchant_id = req.admin.merchant_id;

  try {
    // clear the cookie
    res.clearCookie("adminToken");

    res.status(200).json({ success: "Admin logged out" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const addPayoutAccount = async (req, res) => {
  try {
    const merchant_id = req.admin.merchant_id;

    const body = req.body
    
    //// validate the requests

    const rule = {
      accountNumber: ['required', 'number'],
      accountName: ['required', 'string'],
      bank: ['required', 'string'],
      bankCode: ['required', 'number']
    };

    await validateBody(body, rule);

    if (accountNumber.length != 10)
    {
      res.status(400)
      throw new Error("Invalid Account Number size");
    }

    /// Create the flutterwave payout account
    const merchant = Merchant.findById(merchant_id);

    if (!merchant) {
      res.status(404);
      throw new Error("Mercchant not found");
    }


    /// Add the merchant bank account

    const payout = new PayoutAccount({
      merchant_id,
      accountNumber,
      accountName,
      bank,
      bankCode,
      status: false
    });
  
    const response = await payout.save();

    return res.status(201).json({ message: "Payout Account Added", data: response });
  }catch(error) {
    return res.status(400).json({
      error
    })
  }
}

module.exports = {
  getAllMerchants,
  inviteNewAdmin,
  addNewAdmin,
  getMerchant,
  onboard,
  createCashier,
  getCashiers,
  salesData,
  salesSummary,
  allTimeSales,
  getSalesData,
  getDashboard,
  saveDashboard,
  updateDashboard,
  getPaymentTypes,
  configureApiSettings,
  setMerchantPaymentSettings,
  deactiateAccount,
  signOut,
  removeCashier,
  getCashierOnShift,
  addPayoutAccount
  // checkAuth,
};
