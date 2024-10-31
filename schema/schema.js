const mongoose = require("mongoose");

const Schema = mongoose.Schema;

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

const cartFormat = new Schema(
  {
    price: {
      type: Number,
    },

    name: { type: String },

    quantity: { type: Number },
    ean_code: { type: String, required: true },
    id: { type: String, required: true },
  },
  { timestamps: true }
);

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
  },
  { timestamps: true }
);

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

module.exports = {
  productFormat: mongoose.model(
    "productFormat",
    productFormat,
    "productformats"
  ),
  cartFormat: mongoose.model("cartFormat", cartFormat, "cart"),

  sessionFormat: mongoose.model("sessionFormat", sessionFormat, "session"),
  salesFormat: mongoose.model("salesFormat", salesFormat, "sales"),
};
