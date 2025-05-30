const express = require("express");
const {
  inviteNewAdmin,
  addNewAdmin,
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
  configureApiSettings,
  getPaymentTypes,
  setMerchantPaymentSettings,
  deactiateAccount,
  signOut,
  removeCashier,
  getCashierOnShift
} = require("../controllers/merchantController");
const router = express.Router();
const Admin = require("../schema/adminSchema");

const { salesFormat } = require("../schema/schema");
const adminRequireAuth = require("../middleware/adminRequireAuth");
// const Cashier = require("../schema/cashierSchema");

// middleware
router.use(adminRequireAuth);

router.get("/check-auth", (req, res) => {
  try {
    const checkID = req.admin._id;
    const checkMerch = req.admin.merchant_id;

    if (checkID && checkMerch) {
      res.status(200).json({ success: true, hasMerch: true });
    } else if (checkID && !checkMerch) {
      res.status(200).json({ success: true, hasMerch: false });
    } else {
      throw new Error("Unauthorized: No token provided");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/profile", async (req, res) => {
  const { _id, merchant_id } = req.admin;

  try {
    const profile = await Admin.findOne({ _id, merchant_id }).select(
      "firstName lastName -_id"
    );

    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// add merchant
router.post("/onboard", onboard);

// add cashier
router.post("/createCashier", createCashier);

// get cashiers
router.get("/getCashiers", getCashiers);

router.delete("/removeCashier/:_id", removeCashier);

router.get("/allTimeSales", allTimeSales);

router.get("/sales-summary", salesSummary);

router.get("/salesData", getSalesData);

// handled
router.get("/dashboard", getDashboard);

router.post("/dashboard", saveDashboard);

router.patch("/dashboard/:_id", updateDashboard);

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

router.put("/configureApi", configureApiSettings);

router.get("/paymentTypes", getPaymentTypes);

router.put("/paymentTypes", setMerchantPaymentSettings);

router.get("/deactivate", deactiateAccount);

router.get("/signout", signOut);

router.get("/onlineCashiers", getCashierOnShift);

module.exports = router;
