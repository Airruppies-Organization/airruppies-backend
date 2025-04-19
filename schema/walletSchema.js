const mongoose = require("mongoose");


const Schema = mongoose.Schema;

const walletFormat = new Schema(
    {
        user_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
        },
        tx_ref: {
                type: String,
                required: true
        },
        balance: {
                type: Number,
                required: true,
                default: 0
        },
        email: {
                type: String,
                required: true,
                unique: true
        },
        accountNumber: {
                type: String,
                required: true,
                unique: true
        },
        ref: {
                type: String,
                required: true
        },
        bankName: {
                type: String,
                required: true
        },
        walletType: {
                type: String,
                required: true,
                enum: ["dynamic", "static"]
        }
    },
    { timestamps: true }
);


walletFormat.statics.createWallet = async function(userId, tx_ref, email, accountNumber, ref, bankName, walletType) {
    const wallet = new this({
        user_id: userId,
        tx_ref: tx_ref,
        email: email,
        accountNumber: accountNumber,
        ref: ref,
        bankName: bankName,
        walletType: walletType
    });

    await wallet.save();
    return wallet;
}

walletFormat.statics.getWallet = async function(user_id) {
    if (!user_id) throw new Error('User Id is required');

    const wallet = await this.findOne({ user_id: new mongoose.Types.ObjectId(user_id) })

    if (!wallet) {
        return false;
    }

    return wallet;
}


walletFormat.statics.updateWallet = async function(user_id, tx_ref, accountNumber, ref, bankName, walletType = "dynamic") {
    if (!user_id) throw new Error('User Id is required');

    const wallet = await this.findOne({ user_id: new mongoose.Types.ObjectId(user_id) })

    if (!wallet) {
        const error = new Error('Wallet not found');
        error.statusCode = 404;
        throw error;
    }

    wallet.tx_ref = tx_ref;
    wallet.accountNumber = accountNumber;
    wallet.ref = ref;
    wallet.bankName = bankName;
    wallet.walletType = walletType;

    await wallet.save();

    return wallet;
}

module.exports = mongoose.model("Wallet", walletFormat, "wallets");