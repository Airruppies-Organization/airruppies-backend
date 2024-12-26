const mongoose = require("mongoose");
const PaymentType = require("./paymentTypeSchema");

const Schema = mongoose.Schema;

const billFormat = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    bill_code : {
      type: String,
      required: true
    },
    orders: {
      type: Array,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      default: 'unpaid',
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    merchant_id: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);


billFormat.statics.createBillCode = function () {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let billCode = '';
  for (let i = 0; i < 7; i++) {
    billCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return billCode;
}

billFormat.statics.createBill = async function (
  user_id,
  orders,
  paymentMethod,
  price,
  quantity,
  merchant_id
){
  if (!user_id || orders.length == 0 || !paymentMethod || price < 1 || quantity < 1 || !merchant_id)
  {
    throw new Error('All fields should be filled');
  }

  const bill_code = this.createBillCode();

  const payment = await PaymentType.findOne({ _id: paymentMethod });
  let paymentStatus = 'unpaid';


  if (!payment) {
    throw new Error('Payment method not found');
  }

  if (payment.status === 'inactive') {
    throw new Error('Payment method is inactive');
  }

  if (payment.paymentType.toLowerCase() === 'wallet') {
    paymentStatus = 'paid';
  }

  const bill = new this({ user_id, bill_code, orders, paymentMethod, price, quantity, merchant_id, paymentStatus });

  return await bill.save();
}


module.exports = mongoose.model("Bill", billFormat, "bills");