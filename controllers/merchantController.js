// Description: It has all the functions related to merchant.
const Merchant = require("../schema/merchantSchema");
const Admin = require("../schema/adminSchema");
const mailer = require("../lib/mailer");
const jwt = require("jsonwebtoken");
const Cashier = require("../schema/cashierSchema");
const paymentType = require("../schema/paymentTypeSchema");

const {
    salesFormat,
    dashboardFormat,
  } = require("../schema/schema");


require("dotenv").config();

const createToken = (_id) => {
  const token = jwt.sign({ _id }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: "2d",
  });
  return token;
};

const onboard = async (req, res) => {
  const { name, state, address, logo, lng, lat, payment_types} = req.body;

  const admin_id = req.admin._id;

  try {

    const merchant = await Merchant.onboard(
      name,
      state,
      address,
      logo,
      admin_id,
      lng,
      lat
    );

    await Merchant.addPaymentType(merchant._id, payment_types);

    res.status(200).json({ merchant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.allMerchants();
    return res.status(200).json(merchants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const inviteNewAdmin = async (req, res) => {
  const { email, merchant_id } = req.body;

  try{
      // Verify the Email
      const admin = await Admin.getAdminByEmail(email);
      if(admin){
        throw new Error('Admin already exists');
      }

      //Get the Merchant

      const merchant = await Merchant.getMerchantById(merchant_id);

      // Invite the Admin
      const encryptedMerchantId = merchant.encryptMerchId;
      const message = `You have been invited to be an admin of a merchant. Click on this link to accept the invite: https://localhost:3000/merchant/invite/${encryptedMerchantId.encryptedData}/${encryptedMerchantId.iv}`;
      mailer.sendEmail('donotreply', email, message, 'Admin Invite');

      return res.status(200).json({ message: 'Admin invited' });
  }catch(error){
      return res.status(400).json({ error: error.message });
  }
};


const addNewAdmin = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const { encryptedData, iv } = req.params;

  try {
    if (!encryptedData || !iv) {
      throw new Error("Invalid link");
    }

    if (!firstName || !lastName || !email || !password) {
      throw new Error("All fields not filled");
    }

    if (!validator.isEmail(email)) {
      throw new Error("Invalid email");
    }

    if (!validator.isStrongPassword(password)) {
      throw new Error("This password is not strong enough");
    }

        // Decrypt the merchant_id
        const encryption = { encryptedData, iv };
        const merchant_id = encrypter.decrypt(encryption);

        // Check if the merchant exists
        const merchant = await Merchant.getMerchantById(merchant_id);
        if (!merchant){
            throw new Error('Merchant does not exist');
        }

        // Create the Admin
        const admin = await Admin.signup(firstName, lastName, email, password, merchant_id);
        const token = createToken(admin._id);
        const hasMerch = true;
        const adminEmail = admin.email;

    return res.status(200).json({ adminEmail, token, hasMerch });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getMerchant = async (req, res) => {
  const { merchant_id } = req.params;

  try {
    const merchant = await Merchant.getMerchantById(merchant_id);
    return res.status(200).json(merchant);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};


module.exports = { getAllMerchants, inviteNewAdmin, addNewAdmin };