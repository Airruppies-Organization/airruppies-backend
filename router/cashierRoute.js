const express = require("express");
const cashierRequireAuth = require("../middleware/cashierRequireAuth");
const router = express.Router();

router.use(cashierRequireAuth);

router.get("/sessionData", async (req, res) => {
  const merchant_id = cashier.merchant_id;
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
  const merchant_id = cashier.merchant_id;

  const { id, code, method, status, total, data } = req.body;

  try {
    const result = await salesFormat.create({
      id,
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

module.exports = router;
