const Cart = require("../schema/cartSchema");
const Merchant = require("../schema/merchantSchema");


const addToCart = async (req, res) => {
    const { product_code, merchant_id, quantity, product_name, price } = req.body;
    const {_id } = req.user

    try {

        const merchant = await Merchant.getMerchantById(merchant_id);

        if (!merchant) return res.status(400).json({ message: 'Merchant not found' });

        const response = await Cart.addToCart(_id, product_code, merchant_id, quantity, price, product_name);
        
        if (response) {
            const cartData = await Cart.getCartItems(_id, merchant_id);
            return res.status(200).json({ message: 'Product added to cart', cartData });
        }

        return res.status(400).json({ message: 'Try again' });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const removeFromCart = async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;
    const { merchant_id} = req.body

    try {
        const merchant = await Merchant.getMerchantById(merchant_id);
        if (!merchant) return res.status(400).json({ message: 'Merchant not found' });

        const response = await Cart.removeFromCart(id);
        if (!response) return res.status(400).json({ message: 'Try again' });

        const cartData = await Cart.getCartItems(_id, merchant_id);
        return res.status(200).json({ message: 'Product removed from cart', data: cartData});
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

const getCartItems = async (req, res) => {
    const { _id } = req.user;
    const { merchant_id} = req.params

    try{
        const merchant = await Merchant.getMerchantById(merchant_id);
        if (!merchant) return res.status(400).json({ message: 'Merchant not found' });

        const cartData = await Cart.getCartItems(_id, merchant_id);
        return res.status(200).json({ message: 'All Cart Items', data: cartData});

    }catch(error) {
        return res.status(400).json({ error: error.message })
    }
}

module.exports = { addToCart, removeFromCart, getCartItems };