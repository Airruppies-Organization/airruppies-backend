const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const User = require("../schema/userSchema");
const mongoose = require("mongoose");
const Merchant = require("../schema/merchantSchema");
const {
  productFormat,
  cartFormat,
  sessionFormat,
  salesFormat,
  ordersFormat,
} = require("../schema/schema");

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
  const { price, name, quantity, ean_code, id, cartFormat: format } = req.body;
  const user_id = req.user._id;
  try {
    const cart = await cartFormat.create({
      price,
      name,
      quantity,
      ean_code,
      id,
      user_id,
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
router.delete("/cartData/:_id", async (req, res) => {
  const { _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ error: "No such product" });
  }
  const product = await cartFormat.findByIdAndDelete(_id);
  if (!product) {
    return res.status(404).json({ error: "no such product" });
  }
  res.status(200).json(product);
  console.log("item already deleted");
});

router.post("/sessionData", async (req, res) => {
  const { id, code, method, status, data } = req.body;
  const user_id = req.user._id;

  try {
    const session = await sessionFormat.create({
      id,
      code,
      method,
      status,
      data,
      user_id,
      // format,
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

router.get("/fetchMerchants", async (req, res) => {
  const merchants = {
    merchants: [
      {
        name: "Merchant 1",
        state: "Lagos",
        city: "Surulere",
        address: "Adeniran Ogunsanya St, Surulere, Lagos 101241, Lagos",
        logo: "logo1.png",
        admins: ["admin_id"],
        latitude: 6.494678803696833,
        longitude: 3.3558995475171507,
      },
      {
        name: "Merchant 2",
        state: "Lagos",
        city: "Surulere",
        address: "230 Adetola St, Ijesha Tedo, Aguda 101241, Lagos",
        logo: "logo2.png",
        admins: ["admin_id"],
        latitude: 6.4847895656961745,
        longitude: 3.3320387227558332,
      },
      {
        name: "Merchant 3",
        state: "Lagos",
        city: "Surulere",
        address: "Adeniran Ogunsanya St, Surulere, Lagos 101211, Lagos",
        logo: "logo3.png",
        admins: ["admin_id"],
        latitude: 6.490643283502076,
        longitude: 3.3574483460332027,
      },
    ],
  };
  try {
    // const merchants = await Merchant.find({});
    res.status(200).json(merchants);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
