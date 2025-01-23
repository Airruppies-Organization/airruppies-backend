const express = require("express");
const {
  getBill,
  resetPassword,
  sendToken,
} = require("../controllers/cashierControllers");
const cashierRequireAuth = require("../middleware/cashierRequireAuth");
const paymentType = require("../schema/paymentTypeSchema");
const { sessionFormat } = require("../schema/schema");
const salesFormat = require("../schema/salesSchema");
const Bill = require("../schema/billSchema");
const router = express.Router();
const cartFormat = require("../schema/cartSchema");
const orderFormat = require("../schema/orderSchema");
// const cashierAuth = require("../middleware/cashierAuth");

router.use(cashierRequireAuth);

router.get("/check-auth", (req, res) => {
  try {
    const checkID = req.cashier._id;
    const checkMerch = req.cashier.merchant_id;

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
router.post("/getbill", getBill);
router.post("/resetpassword", resetPassword);
router.post("/sendtoken", sendToken);

router.get("/billData", async (req, res) => {
  const merchant_id = req.cashier.merchant_id;

  // come back to this
  try {
    const { code } = req.query;

    // console.log(code);

    const result = await Bill.findOne({
      bill_code: code,
      merchant_id,
    }).lean();

    if (!result) {
      return res.status(404).json({ message: "Invalid code" });
    }

    const paymentMethod = await paymentType.findById(result.paymentMethod);

    // console.log({ ...result, paymentMethod: paymentMethod.paymentType });
    res
      .status(200)
      .json({ ...result, paymentMethod: paymentMethod.paymentType });
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ message: err.message });
  }
});

// the cashier will remove bill from billSchema, add transaction to sales schema, remove everything from the shopper's cart, amd update the ordersFormat

router.post("/clearOrder", async (req, res) => {
  // remove bill from the bill schema

  // const { code } = req.query;
  const merchant_id = req.cashier.merchant_id;
  const { bill_code, payment_method, status, total_price, data, user_id } =
    req.body;

  console.log(bill_code, payment_method, status, total_price, data, user_id);
  try {
    const deleteItem = await Bill.findOneAndDelete({
      bill_code: bill_code,
      merchant_id,
    });

    if (!deleteItem) {
      console.log("No document matched the query.");
      throw new Error("No document matched the query.");
    } else {
      console.log("deleted from billSchema");
      // res.status(200).json({ message: "Session deleted" });
    }

    //add transaction to sales schema

    // we will also need to add the customer's details
    const result = await salesFormat.create({
      bill_code,
      payment_method,
      status,
      total_price,
      data,
      merchant_id,
    });

    result && console.log("Order updated to sales", result);

    // remove everything from the shopper's cart
    const clearedCart = await cartFormat.clearCart(user_id, merchant_id);

    res.status(200).json({ message: "Order cleared successfully" });
  } catch (error) {
    console.error("Error clearing order:", error);
    res.status(400).json({ error: error.message });
  }
});

// router.post("/salesData", async (req, res) => {
//   const merchant_id = req.cashier.merchant_id;

//   const { bill_code, payment_method, status, total_price, data } = req.body;

//   const sale = await salesFormat.findOne({ bill_code, merchant_id });
//   if (sale) {
//     return res.status(404).json({ message: "bill already exists" });
//   }

//   try {
//     const result = await salesFormat.create({
//       bill_code,
//       payment_method,
//       status,
//       total_price,
//       data,
//       merchant_id,
//     });

//     console.log(result);
//     res.status(200).json(result);
//   } catch (err) {
//     res.status(400).json({ err: err.message });
//   }
// });

// router.delete("/billData", async (req, res) => {
//   const { code } = req.query;
//   const merchant_id = req.cashier.merchant_id;

//   try {
//     const deleteItem = await Bill.findOneAndDelete({
//       bill_code: code,
//       merchant_id,
//     });

//     if (!deleteItem) {
//       console.log("No document matched the query.");
//     } else {
//       res.status(200).json({ message: "Session deleted" });
//     }
//   } catch (error) {
//     console.error("Error deleting document:", error);
//     res.status(400).json({ error: error.message });
//   }
// });

module.exports = router;
