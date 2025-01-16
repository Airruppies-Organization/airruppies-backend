const Bill = require('../schema/billSchema');
const Session = require('../schema/sessionSchema');
const Order = require('../schema/orderSchema');



const createBill = async (req, res) => {
    const { data, merchant_id, price, quantity, paymentMethod } = req.body;
    const { _id } = req.user;
    try{
        if (!_id || data.length == 0 || !merchant_id || !price || !quantity || !paymentMethod){
            throw new Error("all fields not filled");
        }
        const bill = await Bill.createBill(_id, data, paymentMethod, price, quantity, merchant_id);
        await Session.createSession(bill.bill_code, merchant_id);

        res.status(200).json({ bill, message: "bill created" });
    }catch(error){
        res.status(400).json({ error: error.message });
    }
}



module.exports = {
    createBill
}