const mongoose = require("mongoose");
// const { options } = require("request");

const Schema = mongoose.Schema;

const paymentTypeFormat = new Schema(
  {
    paymentType: {
      type: String,
      required: true,
      enum: ["Card", "Cash", "POS"],
    },
    status: {
      type: String,
      required: true,
      default: "active",
    },
  },
  { timestamps: true }
);

paymentTypeFormat.statics.createPaymentType = async function (
  paymentType
  // merchant_id
) {
  if (!paymentType) throw new Error("Payment type is required");

  const payment = await this.create({ paymentType });

  return payment;
};

module.exports = mongoose.model(
  "PaymentType",
  paymentTypeFormat,
  "paymentTypes"
);
