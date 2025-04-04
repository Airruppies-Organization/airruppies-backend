const express = require("express");
const {
  getAllMerchants,
  getMerchant,
} = require("../controllers/merchantController");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const User = require("../schema/userSchema");
const {
  profile,
  paymentTypes,
  updateProfile,
  setPinCode,
  authorizePayment,
  changePin
} = require("../controllers/userControllers");
const {
  addToCart,
  removeFromCart,
  getCartItems,
  updateCart,
} = require("../controllers/cartController");
const Merchant = require("../schema/merchantSchema");
const {
  productFormat,
  sessionFormat,
  ordersFormat,
} = require("../schema/schema");
const { createBill } = require("../controllers/billController");
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
router.get("/profile", profile);

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

// post cart data
router.post("/cart", addToCart);

router.get("/cart", getCartItems);

// Delete cart item
router.delete("/cart", removeFromCart);

router.post("/updateCart", updateCart);

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

//router.post("/order/create", createOrder);

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
  const queries = req.query;

  const query = {};
  if (queries.searchStore) {
    const searchTerm = queries.searchStore.trim();
    query.$or = [
      ...(query.$or || []), // Preserve existing $or conditions
      { name: { $regex: searchTerm, $options: "i" } },
    ];
  }

  try {
    const merchants = await Merchant.find(query).select(
      "name city state address logo lng lat _id"
    );

    res.status(200).json(merchants);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/merchant", getMerchant);

// Get Payment Types
router.get("/paymentTypes", paymentTypes);

// Pay for Products
router.post("/pay", createBill);

router.put("/profile", updateProfile);



// Set pincode
router.put('/pin/set', setPinCode);

router.post('/authorizePayment', authorizePayment);

router.put('/pin/change', changePin);


/// Set KYC




module.exports = router;
