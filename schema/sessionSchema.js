const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const sessionFormat = new Schema(
  {
    bill_code : {
      type: String,
      required: true
    },
    merchant_id: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);


sessionFormat.statics.createSession = async function (bill_code, merchant_id) {
  if (!bill_code || !merchant_id) throw new Error("All fields are required");

  const session = await this.create({ bill_code, merchant_id });

  return session;
}


module.exports = mongoose.model("Session", sessionFormat, "sessions");