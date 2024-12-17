const Cart = require("../schema/cartSchema");
const Merchant = require("../schema/merchantSchema");


const addToCart = async (req, res) => {
    const { user_id, product_code, merchant_id, quantity, product_name, price } = req.body;

    try {

        const merchant = await Merchant.getMerchantById(merchant_id);

        if (!merchant) return res.status(400).json({ message: 'Merchant not found' });

        const response = await Cart.addToCart(user_id, product_code, merchant_id, quantity, price, product_name);
        
        if (response) return res.status(200).json({ message: 'Product added to cart' });

        return res.status(400).json({ message: 'Try again' });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const removeFromCart = async (req, res) => {
    const { id } = req.params;

    try {
        const response = await Cart.removeFromCart(id);
        if (!response) return res.status(400).json({ message: 'Try again' });
        return res.status(200).json({ message: 'Product removed from cart' });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

module.exports = { addToCart, removeFromCart };