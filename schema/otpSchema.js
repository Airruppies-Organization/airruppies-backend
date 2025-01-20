const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const otpFormat = Schema(
  {
    identifier: {
      type: String,
      required: true,
    },
    code: {
      type: Number,
      required: true,
    },
    exptime: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "active",
    },
  },
  { timestamps: true }
);

otpFormat.statics.createCode = async function (identifier, code, exptime) {
  const otp = new this({
    identifier,
    code,
    exptime,
  });

  await otp.save();
  return true;
};

otpFormat.statics.verifyCode = async function (identifier, code) {
  const otp = await this.findOne({ identifier, code });

  if (!otp) {
    throw new Error("Invalid OTP");
  }

  // Check if the code has been used
  if (otp.status === "inactive") {
    throw new Error("OTP has been used");
  }

  // Check if the code has expired
  const currentTime = Date.now();
  if (otp.exptime < currentTime) {
    throw new Error("OTP has expired");
  }

  if (otp.code === code && otp.identifier === identifier) {
    otp.status = "inactive";
    await otp.save();
    return true;
  }

  return false;
};

module.exports = mongoose.model("Otp", otpFormat, "otps");
