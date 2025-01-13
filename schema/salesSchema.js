const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const salesFormat = new Schema(
  {
    bill_code: {
      type: String,
      required: true,
    },
    payment_method: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    total_price: {
      type: Number,
    },
    // data: [cartFormat],
    merchant_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("salesFormat", salesFormat, "sales");
