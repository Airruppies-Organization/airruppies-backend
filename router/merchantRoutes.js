const express = require("express");
const Cashier = require("../schema/cashierSchema");
const {
  inviteNewAdmin,
  addNewAdmin,
} = require("../controllers/merchantController");
const router = express.Router();
const { sessionFormat, salesFormat } = require("../schema/schema");
const adminRequireAuth = require("../middleware/adminRequireAuth");
// const Cashier = require("../schema/cashierSchema");
const Merchant = require("../schema/merchantSchema");

// middleware
router.use(adminRequireAuth);

// add merchant
router.post("/onboard", async (req, res) => {
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
    res.status(400).json({ error: error.message });
  }
});

// add cashier
router.post("/createCashier", async (req, res) => {
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
});

// get cashiers
router.get("/getCashiers", async (req, res) => {
  try {
    const merchant_id = req.admin.merchant_id;
    const cashiers = await Cashier.find({ merchant_id }).select(
      "fullName email phoneNumber badge_id"
    );

    res.status(200).json(cashiers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/allTimeSales", async (req, res) => {
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
        throw new Error("Unsupported time range. Use one of: 1D, 5D, 1M, 1Y");
    }

    return startTime; // Return the Date object for the query
  };

  try {
    const { range } = req.query;

    // Validate inputs
    if (!range) {
      return res
        .status(400)
        .json({ message: "Time range (range) is required" });
    }

    const merchant_id = req.admin?.merchant_id; // Ensure merchant_id exists
    if (!merchant_id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Missing merchant_id" });
    }

    const startTime = getTimeRange(range); // Get the start time based on the range

    // Query salesFormat to get total sales in 15-minute intervals for the selected time range
    const sales = await salesFormat.aggregate([
      {
        $match: {
          createdAt: { $gte: startTime },
          merchant_id: merchant_id, // Match the merchant_id
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
    console.error("Error in /allTimeSales:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/salesData", async (req, res) => {
  const merchant_id = req.admin.merchant_id;
  try {
    const data = await salesFormat.find({ merchant_id });
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.get("/sales-summary", async (req, res) => {
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
              $match: { createdAt: { $gte: startOfDay } },
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$total" },
                transactionCount: { $count: {} },
              },
            },
          ],
          monthly: [
            {
              $match: { createdAt: { $gte: startOfMonth } },
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$total" },
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
});

// Invite New Admin
router.post("/inviteNewAdmin", inviteNewAdmin);

// Add New Admin
router.post("/addNewAdmin/:encryptedData/:iv", addNewAdmin);

module.exports = router;
