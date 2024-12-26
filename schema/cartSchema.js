const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const Schema = mongoose.Schema;

const cartFormat = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    product_code: {
      type: String,
      required: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
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
    status: {
      type: String,
      default: "active",
    }
  },
  { timestamps: true }
);


cartFormat.statics.getCartItems = async function (user_id, merchant_id) {
  if (!user_id) throw new Error("user id not defined");

  const cartItems = await this.find({user_id, merchant_id, status: 'active'}, { _id: 1, product_name: 1, price: 1, quantity: 1, product_code: 1 });

  return cartItems;
}

cartFormat.statics.addToCart = async function (
  user_id,
  product_code,
  merchant_id,
  quantity,
  price,
  product_name
) {
  if (!user_id || !product_code || !product_name || !merchant_id || !quantity || !price) {
    throw new Error("all fields not filled");
  }

  const exist = await this.findOne({ user_id, product_code, merchant_id });

  if (exist) {
    // Increase the quantity of the product in the cart
    exist.quantity += quantity;
    exist.price += price;
    return await exist.save();
  }

  const cart = new this({ user_id, product_code, merchant_id, quantity, price, product_name });
  return await cart.save();
}

cartFormat.statics.getCartItem = async function (cart_id){
  if (!cart_id) {
    throw new Error("cart id not provided");
  }

  const cart = await this.findOne({ _id: cart_id });
  if (!cart) {
    throw new Error("cart not found");
  }

  return cart;
}

cartFormat.statics.removeFromCart = async function (cart_id){
  const cart = await this.getCartItem(cart_id);
  cart.status = "inactive";
  return await cart.save();
}

module.exports = mongoose.model("Cart", cartFormat, "carts");
