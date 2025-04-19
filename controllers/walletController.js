const Wallet = require('../schema/walletSchema');
const flutterwave = require('../lib/flutterwave');
const User = require('../schema/userSchema');

const createStaticWallet = async (req, res) => {
    const {bvn} = req.body;
    const user_id = req.user;

    try{

        if (!bvn) res.status(400).json({message: "all fields are required"});
        
        const user = await User.findOne({ _id: user_id});

        if (!user) return res.status(404).json({message: "User not found"});

        /// Check if the user has a wallet already
        const walletCheck = await Wallet.findOne({ email: user.email });

        if (walletCheck.walletType == 'static') return res.status(400).json({message: "Wallet created already"});

        const response = await flutterwave.createStaticVirtualAccount(user.email, bvn)

        if (response.status !== "success") return res.status(400).json({message: response.message})

        const { data } = response;

        let wallet = [];

        if (walletCheck.walletType == 'dynamic') {
            /// Update the Dynamic Wallet
            wallet = await Wallet.updateWallet(
                user_id,
                data.tx_ref,
                data.account_number,
                data.flw_ref,
                data.bank_name,
                'static'
            );
        }
        else
        {
            // save the details to the wallet
            wallet = await Wallet.createWallet(
                user_id,
                data.tx_ref,
                user.email,
                data.account_number,
                data.flw_ref,
                data.bank_name,
                "static"
            );
        }

        res.status(201).json({
            message: "Wallet Created",
            data: {
                "accountNumber": wallet.accountNumber,
                "email": wallet.email,
                "bankName": wallet.bankName,
                "balance": wallet.balance 
            }
        });

    }catch(error) {
        res.status(400).json({message: error.message});
    }
}


const createDynamicWallet = async (req, res) => {
    const {amount} = req.body;
    const user_id = req.user;

    try {
        if (!amount) return res.status(400).json({message: "all fields are required"});
        
        if (typeof(amount) !== 'number' || amount < 1) return res.status(400).json({message: "Invalid amount"});

        const user = await User.findOne({ _id: user_id});

        if (!user) return res.status(404).json({message: "User not found"})

        const response = await flutterwave.createDynamicVirtualAccount(user.email, amount);

        if (response.status !== "success") return res.status(400).json({message: response.message});

        const { data } = response;

        /// Check if the user already has a wallet
        let wallet = await Wallet.getWallet(user_id);

        if (wallet) {

            /// Only dynamic wallet users access this
            if (wallet.walletType !== 'dynamic') return res.status(403).json({
                message: "Only users with dynamic wallets can use this"
            });

            /// Check that balance does not exceed 10k
            const balance = wallet.balance + amount;
            if (balance > 10000) return res.status(400).json({ message: "This wallet cannot exceed the 10,000 naira limit. Upgrade your wallet to exceed this limit"});

            // Update the wallet details
            wallet = await Wallet.updateWallet(user_id, data.tx_ref, data.account_number, data.flw_ref, data.bank_name);
        }

        else {
            /// create a new Wallet for the User
            // save the details to the wallet
            wallet = await Wallet.createWallet(
                user_id,
                data.tx_ref,
                user.email,
                data.account_number,
                data.flw_ref,
                data.bank_name,
                "dynamic"
            )
        }
    
       
        return res.status(201).json({
            message: "Wallet Created",
            data: {
                "accountNumber": wallet.accountNumber,
                "bankName": wallet.bankName,
                "email": wallet.email,
                "expires": data.expiry_date            
            }
        });

    }catch(error) {
        res.status(400).json({
         message: error.message
        })
    }
}


const getWallet = async function (req, res){
    const user_id = req.user;

    try{
        const user = await User.findOne({ _id: user_id});

        if (!user) return res.status(404).json({message: "User not found"})
        
        const wallet = await Wallet.getWallet(user_id);

        if (!wallet) res.status(404).json({message: "Wallet not found"});

        if (wallet.walletType == "dynamic") {
            return res.status(200).json({
                message: "Wallet Details",
                data: {
                    "accountNumber": null,
                    "bankName": null,
                    "email": wallet.email,
                    "balance": wallet.balance
                }
            })
        }

        return res.status(200).json({
            message: "Wallet Details",
            data: {
                "accountNumber": wallet.accountNumber,
                "bankName": wallet.bank_name,
                "email": wallet.email,
                "balance": wallet.balance
            }
        })

    }catch(err) {
        res.status(400).json({
            message: err.message
        })
    }
}


const verifyBVN = async (req, res) => {

}


module.exports = {
    createStaticWallet,
    createDynamicWallet,
    getWallet
}