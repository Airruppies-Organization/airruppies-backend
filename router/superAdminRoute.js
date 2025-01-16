const express = require("express");
const router = express.Router();
const Merchant = require("../schema/merchantSchema");
const Shopper = require("../schema/userSchema");
const salesFormat = require("../schema/salesSchema");

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

router.get("/top-businesses", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0); // Daily top businesses
    const dailyTopBusinesses = await Merchant.aggregate([
      {
        $lookup: {
          from: "sales",
          localField: "_id",
          foreignField: "merchant_id",
          as: "sales",
        },
      },
      { $unwind: "$sales" },
      { $match: { "sales.createdAt": { $gte: startOfDay } } },
      {
        $group: {
          _id: "$_id",
          businessName: { $first: "$name" },
          totalSales: { $sum: "$sales.total_price" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]); // Monthly top businesses
    const monthlyTopBusinesses = await Merchant.aggregate([
      {
        $lookup: {
          from: "sales",
          localField: "_id",
          foreignField: "merchant_id",
          as: "sales",
        },
      },
      { $unwind: "$sales" },
      { $match: { "sales.createdAt": { $gte: startOfMonth } } },
      {
        $group: {
          _id: "$_id",
          businessName: { $first: "$name" },
          totalSales: { $sum: "$sales.total_price" },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);
    res.json({ dailyTopBusinesses, monthlyTopBusinesses });
  } catch (err) {
    console.error("Error in /top-businesses route:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/monthly-sales", async (req, res) => {
  try {
    const monthlySales = await salesFormat.aggregate([
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
    res.json(monthlySales);
  } catch (err) {
    console.error("Error in /monthly-sales route:", err);
    res.status(500).send("Internal Server Error");
  }
});
module.exports = router;
