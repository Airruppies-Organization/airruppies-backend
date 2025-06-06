const Cart = require("../schema/cartSchema");
const Merchant = require("../schema/merchantSchema");

const addToCart = async (req, res) => {
  const { product_code, merchant_id, quantity, product_name, price } = req.body;
  const { _id } = req.user;

  try {
    const merchant = await Merchant.getMerchantById(merchant_id);

    if (!merchant)
      return res.status(400).json({ message: "Merchant not found" });

    const response = await Cart.addToCart(
      _id,
      product_code,
      merchant_id,
      quantity,
      price,
      product_name
    );

    if (response) {
      const cartData = await Cart.getCartItems(_id, merchant_id);
      console.log(cartData);
      return res
        .status(200)
        .json({ message: "Product added to cart", cartData: cartData });
    }

    return res.status(400).json({ message: "Try again" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  const { id, merchant_id } = req.query;
  const { _id } = req.user;

  try {
    const merchant = await Merchant.getMerchantById(merchant_id);

    if (!merchant)
      return res.status(400).json({ message: "Merchant not found" });

    const response = await Cart.removeFromCart(id, _id, merchant_id);

    if (!response) return res.status(400).json({ message: "Try again" });

    const cartData = await Cart.getCartItems(_id, merchant_id);

    return res
      .status(200)
      .json({ message: "Product removed from cart", data: cartData });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
};

const getCartItems = async (req, res) => {
  const { _id } = req.user;
  const { merchant_id } = req.query;

  try {
    const merchant = await Merchant.getMerchantById(merchant_id);
    if (!merchant)
      return res.status(400).json({ message: "Merchant not found" });

    const cartData = await Cart.getCartItems(_id, merchant_id);

    return res.status(200).json({ message: "All Cart Items", data: cartData });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const updateCart = async (req, res) => {
  const { id, method, merchant_id } = req.body;
  const { _id } = req.user;

  try {
    if (method === "increase") {
      const result = await Cart.incrementQuantity(id, _id, merchant_id);

      return res.status(200).json({ message: "Cart updated", data: result });
    }

    if (method === "decrease") {
      const result = await Cart.decrementQuantity(id, _id, merchant_id);

      return res.status(200).json({ message: "Cart updated", data: result });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const result = await Cart.incrementQuantity(id, _id, merchant_id);
};

module.exports = { addToCart, removeFromCart, getCartItems, updateCart };
