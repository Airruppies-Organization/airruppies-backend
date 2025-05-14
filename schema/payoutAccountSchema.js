const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const payoutAccountFormat = new Schema(
  {
    merchant_id: {
      type: String,
      required: true
    },
    accountNumber: {
      type: Number,
      required: true
    },
    accountName: {
      type: Number,
      required: true
    },
    bank: {
      type: Number,
      required: true
    },
    bankCode: {
      type: String,
      required: true
    },
    flwID: {
      type: String,
    },
    status: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayoutAccount", payoutAccountFormat, "payoutAccounts");
