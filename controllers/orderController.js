const orderSchema = require('../schema/orderSchema');
const merchantSchema = require('../schema/merchantSchema');
const PaymentType = require('../schema/paymentTypeSchema');


const getPaymentTypes = async (req, res) => {
    try{
        const paymentTypes = (await PaymentType.find({})).filter(paymentType => paymentType.status === true);
        return res.status(200).json({paymentTypes});
    }catch(error){
        return res.status(400).json({error : error.message})
    }
}

const createOrder = async (req, res) => {
    const { product_code, merchant_id, price, quantity } = req.body;
    const { _id } = req.user;


    try{
        if (!_id || !product_code || !merchant_id || !price || !quantity){
            throw new Error("all fields not filled");
        }

        const merchant = await merchantSchema.getMerchantById(merchant_id);
        if (!merchant){
            throw new Error("merchant not found");
        }

        if (price < 1){
            throw new Error("invalid price");
        }

        if (quantity < 1){
            throw new Error("invalid quantity");
        }

        const order = await orderSchema.createOrder(_id, product_code, merchant_id, price, quantity);

        res.status(200).json({ order, message: "order created" });
    }catch(error){
        res.status(400).json({ error: error.message });
    }
}

const cancelOrder = async (req, res) => {
    const { order_id } = req.body;

    try{
        if (!order_id){
            throw new Error("order id not provided");
        }
        const order = await orderSchema.cancelOrder(order_id);
        res.status(200).json({ order, message: "order cancelled" });
    }catch(error){
        res.status(400).json({ error: error.message });
    }
}

const completeOrder = async (req, res) => {
    const { order_id } = req.body;

    try{
        if (!order_id){
            throw new Error("order id not provided");
        }
        const order = await orderSchema.completeOrder(order_id);
        res.status(200).json({ order, message: "order completed" });
    }catch(error){
        res.status(400).json({ error: error.message });
    }
}

module.exports = { createOrder, cancelOrder, completeOrder, getPaymentTypes };