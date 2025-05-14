const mongoose = require("mongoose");


const Schema = mongoose.Schema;

const cardFormat = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        tx_ref: {
            type: String,
            required: true,
            unique: true
        },
        email: {
            type: String,
            required: true,
        },
        bin: {
            type: String,
            required: true,
        },
        last4: {
            type: String,
            required: true,
            unique: true
        },
        expMonth:{
            type: String,
            required: true
        },
        expYear: {
            type: String,
            required: true
        },
        cardToken: {
            type: String,
            required: true,
            unique: true
        },
        customerName: {
            type: String,
            required: true
        },
        cardType: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);


cardFormat.method.details = async function () {
    return {
        _id,
        customerName: this.customerName,
        expYear:  this.expYear,
        expMonth: this.expMonth,
        bin: this.bin,
        last4: this.last4,
        cardType: this.cardType
    }
}

cardFormat.method.token = async function() {
    return {
        token: this.cardToken
    }
}


module.exports = mongoose.model("Card", cardFormat, "cards");