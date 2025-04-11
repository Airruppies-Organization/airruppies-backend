const Bill = require("../schema/billSchema");
const Session = require("../schema/sessionSchema");
const Order = require("../schema/orderSchema");
const Cart = require("../schema/cartSchema");

const createBill = async (req, res) => {
  const { data, merchant_id, price, quantity, paymentMethod } = req.body;
  const { _id } = req.user;
  try {
    if (
      !_id ||
      data.length == 0 ||
      !merchant_id ||
      !price ||
      !quantity ||
      !paymentMethod
    ) {
      throw new Error("all fields not filled");
    }
    const bill = await Bill.createBill(
      _id,
      data,
      paymentMethod,
      price,
      quantity,
      merchant_id
    );

    /// Create the Order and Clear the Cart
    if (bill.paymentStatus === "paid") {
      data.forEach(async (order) => {
        await Order.createOrder(
          _id,
          order.product_code,
          merchant_id,
          order.price,
          order.quantity,
          bill.bill_code
        );

        // Clear the Cart
        await Cart.clearCart(_id, order.product_code, merchant_id);
      });
    }

    await Session.createSession(bill.bill_code, merchant_id);

    res.status(200).json({ bill, message: "bill created" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createBill,
};
