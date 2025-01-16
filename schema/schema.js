const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// shopper
const productFormat = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    supplier: {
      type: String,
    },
    description: {
      type: String,
    },
    ean_code: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// shopper
// const ordersFormat = new Schema(
//   {
//     id: {
//       type: String,
//       required: true,
//     },
//     user_id: {
//       type: String,
//       required: true,
//     },
//     code: {
//       type: String,
//       required: true,
//     },
//     method: {
//       type: String,
//       required: true,
//     },
//     status: {
//       type: String,
//     },
//     total: {
//       type: Number,
//     },
//     // data: [cartFormat],  // is part of the schema
//   },
//   { timestamps: true }
// );

module.exports = {
  productFormat: mongoose.model(
    "productFormat",
    productFormat,
    "productformats"
  ),
  // sessionFormat: mongoose.model("sessionFormat", sessionFormat, "session"),
  // salesFormat: mongoose.model("salesFormat", salesFormat, "sales"),
  // ordersFormat: mongoose.model("ordersFormat", ordersFormat, "orders"),
};
