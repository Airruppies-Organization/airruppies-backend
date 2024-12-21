const express = require("express");
const { getAllMerchants } = require("../controllers/merchantController");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const User = require("../schema/userSchema");
const Merchant = require("../schema/merchantSchema");
const mongoose = require("mongoose");
const {
  productFormat,
  cartFormat,
  sessionFormat,
  salesFormat,
  ordersFormat,
} = require("../schema/schema");
const encrypter = require("../lib/encrypt");

// middleware
router.use(requireAuth);

//Routes

router.get("/verifyToken", async (req, res) => {
  const user_id = req.user._id;

  if (user_id) {
    res.status(200).send("Valid token");
  } else {
    res.status(400).send("Expired token");
  }
});

// get profile
router.get("/profile", async (req, res) => {
  const user_id = req.user._id;
  try {
    const profile = await User.findById(user_id);

    res.status(200).json(profile);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// // get data
// router.get("/products", async (req, res) => {
//   const products = await productFormat.find({});
//   res.status(200).json(products);
// });

// find a product
router.get("/product", async (req, res) => {
  const eanCode = req.query.ean_code; // Access query parameter here

  try {
    const product = await productFormat.findOne({ ean_code: eanCode });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get cart data
router.get("/cartData", async (req, res) => {
  const user_id = req.user._id;

  // if (!mongoose.Types.ObjectId.isValid(user_id)) {
  //   return res.status(400).json({ error: "Invalid user ID" });
  // }
  try {
    const cartData = await cartFormat.find({ user_id });
    res.status(200).json(cartData);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

// post cart data
router.post("/cartData", async (req, res) => {
  const { price, name, quantity, ean_code, merchant_id } = req.body;

  const user_id = req.user._id;

  const decryptedMerchId = encrypter.decrypt(merchant_id);
  try {
    const cart = await cartFormat.create({
      price,
      name,
      quantity,
      ean_code,
      user_id,
      merchant_id: decryptedMerchId,
    });
    res.status(200).json(cart);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// update cart
// router.patch("/cartData/:id", async (req, res) => {
//   const { id } = req.params;
//   const { price, qty } = req.body;
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(404).json({ error: "No such product" });
//   }

//   try {
//     // Find and update the document
//     const product = await cartFormat.findOneAndUpdate(
//       { _id: id },
//       { price, qty },
//       { new: true }
//     );

//     // If no matching document found
//     if (!product) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     // Return the updated document
//     res.status(200).json(product);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// Delete cart item
router.delete("/cartData/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such product" });
  }
  const product = await cartFormat.findByIdAndDelete(id);
  if (!product) {
    return res.status(404).json({ error: "no such product" });
  }
  res.status(200).json(product);
  console.log("item already deleted");
});

router.post("/sessionData", async (req, res) => {
  const { code, method, status, data, merchant_id } = req.body;

  const user_id = req.user._id;

  const decryptedMerchId = encrypter.decrypt(merchant_id);

  try {
    const session = await sessionFormat.create({
      code,
      method,
      status,
      data,
      user_id,
      merchant_id: decryptedMerchId,
    });

    res.status(200).json(session);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.delete("/sessionData", async (req, res) => {
  try {
    const { code } = req.query;
    const result = await sessionFormat.findOneAndDelete({ code });
    if (!result) {
      console.log("Session not found");
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({ message: "Session deleted", result });
    console.log("session deleted successfully");
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.get("/orders", async (req, res) => {
  const user_id = req.user._id;
  try {
    const data = await ordersFormat.find({ user_id });
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/orders", async (req, res) => {
  const { id, code, method, status, total, data } = req.body;
  const user_id = req.user._id;
  try {
    const addOrders = await ordersFormat.create({
      id,
      user_id,
      code,
      method,
      status,
      total,
      data,
    });

    res.status(200).json(addOrders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// router.get("/merchants", getAllMerchants);
router.get("/merchants", async (req, res) => {
  try {
    const merchants = await Merchant.find({}).select(
      "name city state address logo lng lat encryptedMerchId"
    );

    res.status(200).json(merchants);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
