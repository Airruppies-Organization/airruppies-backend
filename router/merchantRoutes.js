const express = require("express");
const { inviteNewAdmin, 
        addNewAdmin, 
        onboard, 
        createCashier,
        getCashiers,
        salesData,
        allTimeSales,
        getSalesData,
        getDashboard,
        saveDashboard,
        updateDashboard,
        configureApiSettings
      } = require("../controllers/merchantController");
const router = express.Router();

const adminRequireAuth = require("../middleware/adminRequireAuth");
// const Cashier = require("../schema/cashierSchema");

router.use(adminRequireAuth);

// add merchant
router.post("/onboard", onboard);

// add cashier
router.post("/createCashier", createCashier);

// get cashiers
router.get("/getCashiers", getCashiers);

// router.get("/sessionData", async (req, res) => {
//   // come back to this
//   try {
//     const { code } = req.query;

//     const result = await sessionFormat.findOne({ code });

//     if (!result) {
//       return res.status(404).json({ message: "Invalid code" });
//     }
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

router.post("/salesData", salesData);

router.get("/allTimeSales", allTimeSales);

router.get("/salesData", getSalesData);

// handled
router.get("/dashboard", getDashboard);

router.post("/dashboard", saveDashboard);

router.patch("/dashboard/:_id", updateDashboard);

// Invite New Admin
router.post("/inviteNewAdmin", inviteNewAdmin);

// Add New Admin
router.post("/addNewAdmin/:encryptedData/:iv", addNewAdmin);

router.put("/configureApi", configureApiSettings);


module.exports = router;
