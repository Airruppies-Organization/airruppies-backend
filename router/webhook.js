const express = require("express");

const { verifyWebhook } = require('../middleware/verifyWebhook');
const { verifyWalletTransaction } = require('../controllers/walletController') 

const router = express.Router();

router.use(verifyWebhook)

router.post("/verifyWalletTransaction", verifyWalletTransaction);
