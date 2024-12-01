const express = require("express");
const Cashier = require("../schema/cashierSchema");
const bcrypt = require("bcrypt");
const router = express.Router();
const {
  sessionFormat,
  salesFormat,
  dashboardFormat,
} = require("../schema/schema");
const adminRequireAuth = require("../middleware/adminRequireAuth");
// const Cashier = require("../schema/cashierSchema");
const Merchant = require("../schema/merchantSchema");

router.use(adminRequireAuth);

// add merchant
router.post("/onboard", async (req, res) => {
  const { name, state, address, logo } = req.body;

  const admin_id = req.admin._id;

  try {
    const merchant = await Merchant.onboard(
      name,
      state,
      address,
      logo,
      admin_id
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
  // const merchant_id = req.admin.merchant_id;
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
          // merchant_id,
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
});

router.get("/getHash", async (req, res) => {
  const merchant_id = req.admin.merchant_id;
  try {
  } catch (err) {
    res.status(500).json({ error: "An error occurred while hashing" });
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

// handled
router.get("/dashboard", async (req, res) => {
  const merchant_id = req.admin.merchant_id;

  try {
    const data = await dashboardFormat.findOne({ merchant_id });

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/dashboard", async (req, res) => {
  const {
    totalSales,
    totalMonthlySales,
    totalMonthlyTrans,
    transactions,
    saies,
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
});

// router.patch("/dashboard/:_id", async (req, res) => {
//   const { _id } = req.params; // Get the user ID from the URL
//   const updates = req.body; // Get the updated fields from the request body

//   try {
//     // Find the user by ID and apply the updates
//     const dashboard = await dashboardFormat.findByIdAndUpdate(_id, updates, {
//       new: true,
//     });

//     if (!dashboard) {
//       return res.status(404).json({ message: "Dashboard not found" });
//     }

//     // Return the updated user
//     res.status(200).json(dashboard);
//   } catch (err) {
//     res.status(400).json({ message: "Error updating user", error: err });
//   }
// });

module.exports = router;
