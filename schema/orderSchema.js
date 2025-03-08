const mongoose = require("mongoose");
const validator = require("validator");

const Schema = mongoose.Schema;

const orderFormat = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    product_code: {
      type: String,
      required: true,
    },
    merchant_id: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      default: "pending",
      required: true
    },
    referenceNumber: {
        type: String,
        required: true,
    }
  },
  { timestamps: true }
);


orderFormat.statics.createReference = async function (merchant_id) {
    if (!merchant_id) {
        throw new Error("merchant id not provided");
    }

    const merchant = await Merchant.getMerchantById(merchant_id);

    return merchant.refPrefix + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}


orderFormat.statics.createOrder = async function (
  user_id,
  product_code,
  merchant_id,
  price,
  quantity
) {
  if (!user_id || !product_code || !merchant_id || !quantity || !price) {
    throw new Error("all fields not filled");
  }

  if (!validator.isNumeric(price)) {
    throw new Error("invalid price");
  }

  const referenceNumber = await this.createReference(merchant_id);

  const order = new this({ user_id, product_code, merchant_id, quantity, price, referenceNumber });
  return await order.save();
}

orderFormat.statics.getOrderById = async function (order_id){
  if (!order_id) {
    throw new Error("order id not provided");
  }

  const order = await this.findOne({ _id: order_id });
  if (!order) {
    throw new Error("order not found");
  }

  return order;
}

orderFormat.statics.cancelOrder = async function (order_id){
  const order = await this.getOrderById(order_id);

  if (!order) throw new Error("order not found");

  if (order.status === "completed") throw new Error("order already completed");
  order.status = "cancelled";
  return await order.save();
}

orderFormat.statics.completeOrder = async function (order_id){
  const order = await this.getOrderById(order_id);

  if (!order) throw new Error("order not found");

  if (order.status === "cancelled") throw new Error("order already cancelled");

  order.status = "completed";
  return await order.save();
}

module.exports = mongoose.model("Order", orderFormat, "orders");