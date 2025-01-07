const express = require("express");
const { login, getBill, resetPassword, sendToken } = require("../controllers/cashierControllers");
const cashierRequireAuth = require("../middleware/cashierRequireAuth");
const { sessionFormat, salesFormat } = require("../schema/schema");
const router = express.Router();
const cashierAuth = require("../middleware/cashierAuth");

router.use(cashierRequireAuth);

router.post("/login", login);
router.post("/getbill", cashierAuth, getBill);
router.post("/resetpassword", resetPassword);
router.post("/sendtoken", sendToken);


router.get("/sessionData", async (req, res) => {
  const merchant_id = req.cashier.merchant_id;

  // come back to this
  try {
    const { code } = req.query;

    const result = await sessionFormat.findOne({ code, merchant_id });

    if (!result) {
      return res.status(404).json({ message: "Invalid code" });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/salesData", async (req, res) => {
  const merchant_id = req.cashier.merchant_id;

  const { code, method, status, total, data } = req.body;

  try {
    const result = await salesFormat.create({
      code,
      method,
      status,
      total,
      data,
      merchant_id,
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.delete("/sessionData", async (req, res) => {
  const { code } = req.query;
  const merchant_id = req.cashier.merchant_id;

  try {
    const deleteItem = await sessionFormat.findOneAndDelete({
      code,
      merchant_id,
    });

    if (!deleteItem) {
      console.log("No document matched the query.");
    } else {
      res.status(200).json({ message: "Session deleted" });
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
