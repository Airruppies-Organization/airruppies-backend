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
const cartFormat = new Schema(
  {
    price: {
      type: Number,
    },

    name: { type: String },

    quantity: { type: Number },
    ean_code: { type: String, required: true },
    id: { type: String, required: true },
    user_id: {
      type: String,
      required: true,
    },
    merchant_id: {
      type: {
        encryptedId: { type: String },
        iv: { type: String },
      },
    },
  },
  { timestamps: true }
);

// shopper
const ordersFormat = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    total: {
      type: Number,
    },
    data: [cartFormat],
  },
  { timestamps: true }
);

//shopper and merchant > cashier
const sessionFormat = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    data: [cartFormat],
    // merchant_id: {
    //   type: {
    //     encryptedData: { type: String },
    //     iv: { type: String },
    //   },
    // },
    merchant_id: { type: String, required: true },
  },
  { timestamps: true }
);

//merchant
const salesFormat = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    total: {
      type: Number,
    },
    data: [cartFormat],
  },
  { timestamps: true }
);

const transactions = new Schema({
  total: { type: Number, default: 0 },
  day: { type: String },
});
const sales = new Schema({
  total: { type: Number, default: 0 },
  month: { type: String },
});

// merchant
const dashboardFormat = new Schema({
  merchant_id: { type: String, required: true },
  totalSales: { type: Number },
  totalMonthlySales: { type: Number },
  totalMonthlyTrans: { type: Number },
  totalTrans: { type: Number },
  sales: [sales],
  transactions: [transactions],
});

module.exports = {
  productFormat: mongoose.model(
    "productFormat",
    productFormat,
    "productformats"
  ),
  cartFormat: mongoose.model("cartFormat", cartFormat, "cart"),

  sessionFormat: mongoose.model("sessionFormat", sessionFormat, "session"),
  salesFormat: mongoose.model("salesFormat", salesFormat, "sales"),
  ordersFormat: mongoose.model("ordersFormat", ordersFormat, "orders"),
  dashboardFormat: mongoose.model(
    "dashboardFormat",
    dashboardFormat,
    "dashboards"
  ),
};
