const express = require("express");
const router = express.Router();
const Merchant = require("../schema/merchantSchema");
const Shopper = require("../schema/userSchema");
const salesFormat = require("../schema/salesSchema");
const PayoutAccount = require("../schema/payoutAccountSchema");
const { updateSubAccount } = require("../lib/flutterwave");
const { validateBody } = require("../lib/validator");

router.get("/analysis", async (req, res) => {
  try {
    const totalMerch = await Merchant.countDocuments();
    const totalInactiveMerch = await Merchant.countDocuments({ status: false });
    const totalShoppers = await Shopper.countDocuments();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const data = await salesFormat.aggregate([
      {
        $facet: {
          daily: [
            { $match: { createdAt: { $gte: startOfDay } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$total_price" },
                transactionCount: { $sum: 1 },
                cashPayment: {
                  $sum: { $cond: [{ $eq: ["$payment_method", "Cash"] }, 1, 0] },
                },
                cardPayment: {
                  $sum: { $cond: [{ $eq: ["$payment_method", "Card"] }, 1, 0] },
                },
                trfPayment: {
                  $sum: {
                    $cond: [{ $eq: ["$payment_method", "Transfer"] }, 1, 0],
                  },
                },
                walletPayment: {
                  $sum: {
                    $cond: [{ $eq: ["$payment_method", "Wallet"] }, 1, 0],
                  },
                },
              },
            },
          ],
          monthly: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$total_price" },
                transactionCount: { $sum: 1 },
                cashPayment: {
                  $sum: { $cond: [{ $eq: ["$payment_method", "Cash"] }, 1, 0] },
                },
                cardPayment: {
                  $sum: { $cond: [{ $eq: ["$payment_method", "Card"] }, 1, 0] },
                },
                trfPayment: {
                  $sum: {
                    $cond: [{ $eq: ["$payment_method", "Transfer"] }, 1, 0],
                  },
                },
                walletPayment: {
                  $sum: {
                    $cond: [{ $eq: ["$payment_method", "Wallet"] }, 1, 0],
                  },
                },
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
      totalMerch: totalMerch,
      totalInactiveMerch: totalInactiveMerch,
      totalShoppers: totalShoppers,
      daily: {
        totalSales: data[0]?.daily?.totalSales || 0,
        transactionCount: data[0]?.daily?.transactionCount || 0,
        cashPayment: data[0]?.daily?.cashPayment || 0,
        cardPayment: data[0]?.daily?.cardPayment || 0,
        trfPayment: data[0]?.daily?.trfPayment || 0,
        walletPayment: data[0]?.daily?.walletPayment || 0,
      },
      monthly: {
        totalSales: parseFloat(data[0]?.monthly?.totalSales || 0).toFixed(2),
        transactionCount: data[0]?.monthly?.transactionCount || 0,
        cashPayment: data[0]?.monthly?.cashPayment || 0,
        cardPayment: data[0]?.monthly?.cardPayment || 0,
        trfPayment: data[0]?.monthly?.trfPayment || 0,
        walletPayment: data[0]?.monthly?.walletPayment || 0,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /analysis route:", error.message);
    res
      .status(400)
      .send({ error: `Error in /analysis route: ${error.message}` });
  }
});

router.get("/topBusinessesToday", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dailyTopBusinesses = await Merchant.aggregate([
      {
        $addFields: {
          salesIdString: { $toString: "$_id" }, // Convert the _id field to string
        },
      },
      {
        $lookup: {
          from: "sales",
          localField: "salesIdString",
          foreignField: "merchant_id",
          as: "sales",
        },
      },
      {
        $unwind: {
          path: "$sales",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [{ "sales.createdAt": { $gte: startOfDay } }, { sales: null }],
        },
      },
      {
        $group: {
          _id: "$_id",
          businessName: { $first: "$name" },
          logo: { $first: "$logo" },
          totalSales: { $sum: { $ifNull: ["$sales.total_price", 0] } },
        },
      },
      {
        $project: {
          _id: 1,
          businessName: 1, // Include businessName
          logo: 1, // Include logo
          totalSales: 1, // Include totalSales
        },
      },
      { $sort: { totalSales: -1 } }, // Sort by total sales in descending order
      { $limit: 5 }, // Limit to the top 5 businesses
    ]);

    res.json({ dailyTopBusinesses });
  } catch (err) {
    console.error("Error in /topBusinessesToday route:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/all-businesses", async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0); // Daily top businesses

    // Monthly top businesses
    const monthlyTopBusinesses = await Merchant.aggregate([
      {
        $addFields: {
          salesIdString: { $toString: "$_id" }, // Convert the _id field to string
        },
      },
      {
        $lookup: {
          from: "sales",
          localField: "salesIdString", // Referencing the converted merchant _id
          foreignField: "merchant_id", // Matching sales with merchant_id
          as: "sales", // Populate sales array
        },
      },
      {
        $addFields: {
          totalSales: {
            $sum: {
              $ifNull: [
                {
                  $map: {
                    input: "$sales",
                    as: "sale",
                    in: "$$sale.total_price",
                  },
                },
                [0],
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          logo: 1,
          totalSales: 1,
        },
      },
      {
        $sort: { totalSales: -1 }, // Sort by totalSales in descending order
      },
    ]);

    res.json({ monthlyTopBusinesses });
  } catch (err) {
    console.error("Error in /all-businesses route:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/monthly-sales", async (req, res) => {
  try {
    const today = new Date();
    const twelveMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 11,
      1
    ); // Start of the month 12 months ago

    const monthlySales = await salesFormat.aggregate([
      // Match only sales in the past 12 months
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$total_price" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalSales: 1,
        },
      },
    ]);

    // Fill in any missing months in the data
    const result = [];
    for (let i = 0; i < 12; i++) {
      const current = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = current.getFullYear();
      const month = current.getMonth() + 1;

      // Find matching sales for the year and month
      const match = monthlySales.find(
        (data) => data.year === year && data.month === month
      );

      result.unshift({
        year,
        month,
        totalSales: match ? match.totalSales : 0,
      });
    }

    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Error in /monthly-sales route:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/set-split-percent", async (req, res) => {
  try {

    const {
      merchant_id,
      percentage
    } = req.body;

    /////Make sure the percentage is a whole number
    const rule = {
      percentage: ['required', 'number']
    }

    await validateBody(req.body, rule);

    ///// Verify the Merchant

    const merchant = await Merchant.findOne({
      id: merchant_id,
      status: true
    });

    if (!merchant) {
      res.status(404);
      throw new Error("Merchant not found");
    }

    ///// Get the Merchnt Payout Account Number

    const payoutAccount = await PayoutAccount.findOne({
      merchant_id,
      status: true
    })

    if (!payoutAccount) {
      res.status(404);
      throw new Error("Payout account not set by merchant");
    }

    //// Get the Subaccount ID

    const subaccount_id = payoutAccount.flwID;

    ///// Update with flutterwave

    const percent = percentage / 100;

    const percentUpdate = await updateSubAccount(res, subaccount_id, percent);
    
    return res.status(201).json({percentUpdate});
  } catch (err) {
    return res.json(err)
  }
});


module.exports = router;
