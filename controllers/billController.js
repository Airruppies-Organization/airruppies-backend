const Bill = require('../schema/billSchema');
const Session = require('../schema/sessionSchema');
const Order = require('../schema/orderSchema');



const createBill = async (req, res) => {
    const { user_id, orders, merchant_id, price, quantity, paymentMethod } = req.body;

    try{
        if (!user_id || orders.length == 0 || !merchant_id || !price || !quantity || !paymentMethod){
            throw new Error("all fields not filled");
        }

        const bill = await Bill.createBill(user_id, orders, paymentMethod, price, quantity, merchant_id);
        await Session.createSession(bill.bill_code, merchant_id);

        res.status(200).json({ bill, message: "bill created" });
    }catch(error){
        res.status(400).json({ error: error.message });
    }
}



module.exports = {
    createBill
}