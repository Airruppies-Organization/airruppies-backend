// Description: It has all the functions related to merchant.
const Merchant = require("../schema/merchantSchema");
const Admin = require("../schema/adminSchema");
const mailer = require("../lib/mailer");
const jwt = require("jsonwebtoken");
const Cashier = require("../schema/cashierSchema");

const {
    salesFormat,
    dashboardFormat,
  } = require("../schema/schema");


require("dotenv").config();

const createToken = (_id) => {
    const token = jwt.sign({ _id }, process.env.ADMIN_JWT_SECRET, {
      expiresIn: "2d",
    });
    return token;
};

const onboard = async (req, res) => {
  const { name, state, address, logo, lng, lat, payment_types} = req.body;

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

    await Merchant.addPaymentType(merchant._id, payment_types);

    res.status(200).json({ merchant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllMerchants = async (req, res) => {
    try {
        const merchants = await Merchant.allMerchants();
        return res.status(200).json(merchants);
    }catch(error){
        res.status(400).json({ error: error.message });
    }
};

const inviteNewAdmin = async (req, res) => {
    const { email, merchant_id } = req.body;

    try{
        // Verify the Email
        const admin = await Admin.getAdminByEmail(email);
        if(admin){
            throw new Error('Admin already exists');
        }

        //Get the Merchant

        const merchant = await Merchant.getMerchantById(merchant_id);

        // Invite the Admin
        const encryptedMerchantId = merchant.encryptMerchId;
        const message = `You have been invited to be an admin of a merchant. Click on this link to accept the invite: https://localhost:3000/merchant/invite/${encryptedMerchantId.encryptedData}/${encryptedMerchantId.iv}`;
        mailer.sendEmail('donotreply', email, message, 'Admin Invite');

        return res.status(200).json({ message: 'Admin invited' });
    }catch(error){
        return res.status(400).json({ error: error.message });
    }
};
  
const addNewAdmin = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const { encryptedData, iv } = req.params;

    try{
        if (!encryptedData || !iv){
            throw new Error('Invalid link');
        }

        if (!firstName || !lastName || !email || !password){
            throw new Error('All fields not filled');
        }

        if (!validator.isEmail(email)){
            throw new Error('Invalid email');
        }

        if (!validator.isStrongPassword(password)){
            throw new Error('This password is not strong enough');
        }

        // Decrypt the merchant_id
        const encryption = { encryptedData, iv };

        // Check if the merchant exists
        const merchant = await Merchant.getMerchantById(encryption.encryptedData);
        if (!merchant){
            throw new Error('Merchant does not exist');
        }

        // Create the Admin
        const admin = await Admin.signup(firstName, lastName, email, password, merchant._id);
        const token = createToken(admin._id);
        const hasMerch = true;
        const adminEmail = admin.email;

        return res.status(200).json({ adminEmail, token, hasMerch });        
    }catch(error){
        return res.status(400).json({ error: error.message });
    }
};

const getMerchant = async (req, res) => {
    const { merchant_id } = req.body;

    try {
        const merchant = await Merchant.getMerchantById(merchant_id);
        return res.status(200).json(merchant);
    }catch(error){
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
  
      res.status(200).json({
        fullName: result.fullName,
        email: result.email,
        phoneNumber: result.phoneNumber,
        badge_id: result.badge_id,
      }); // supposed to be email, token, and an id for that particular business
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
    }
};

const getCashiers = async (req, res) => {
    try {
      const merchant_id = req.admin.merchant_id;
      const cashiers = await Cashier.find({ merchant_id }).select(
        "fullName email phoneNumber badge_id"
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
      let startTime = new Date(); // Start from the current time
  
      switch (range) {
        case "1D":
          startTime.setHours(startTime.getHours() - 24); // Subtract 24 hours
          break;
        case "5D":
          startTime.setDate(startTime.getDate() - 5); // Subtract 5 days
          break;
        case "1M":
          startTime.setMonth(startTime.getMonth() - 1); // Subtract 1 month
          break;
        case "1Y":
          startTime.setFullYear(startTime.getFullYear() - 1); // Subtract 1 year
          break;
        default:
          throw new Error("Unsupported time range");
      }
  
      return startTime; // Return the Date object for the query
    };
  
    try {
      const { range } = req.query;
      const startTime = getTimeRange(range); // Get the start time based on the range
  
      // Query salesFormat to get total sales in 15-minute intervals for the selected time range
      const sales = await salesFormat.aggregate([
        {
          $match: {
            createdAt: { $gte: startTime },
          },
        },
        {
          $project: {
            total: 1,
            createdAt: 1,
            // Decompose "createdAt" into its components
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
                  { $floor: { $divide: ["$truncatedTime.minute", 15] } }, // Group into 15-minute intervals
                  15,
                ],
              },
            },
            sales: { $sum: "$total" },
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
      ]);
  
      // Send the result back
      res.status(200).json({ sales });
    } catch (err) {
      res.status(500).send(err.message);
    }
};

const getSalesData = async (req, res) => {
    const merchant_id = req.admin.merchant_id;
    try {
      const data = await salesFormat.find({ merchant_id });
      res.status(200).json(data);
    } catch (err) {
      res.status(400).json({ err: err.message });
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
    const {merchant_id} = req.body;

    try{
        const paymentTypes = await Merchant.getPaymentType(merchant_id);
        return res.send(200).json({paymentTypes})
    }catch(error)
    {
        return res.send(200).json({error: error.message});
    }
};

const configureApiSettings = async (req, res) => {
    const { merchant_id, product_name, product_price, api_url } = req.body;

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

        return res.status(200).json({ settings, message: "API settings configured" });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};



module.exports = { 
    getAllMerchants,
    inviteNewAdmin, 
    addNewAdmin, 
    getMerchant,
    onboard,
    createCashier,
    getCashiers,
    salesData,
    allTimeSales,
    getSalesData,
    getDashboard,
    saveDashboard,
    updateDashboard,
    getPaymentTypes,
    configureApiSettings
};