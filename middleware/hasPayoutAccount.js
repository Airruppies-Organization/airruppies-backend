const PayoutAccount = require("../schema/payoutAccountSchema");

const requirePayoutAccount = async (req, res, next) => {
  try {
    const { subAccountId, merchantId } = req.body;

    if (!subAccountId) {
      return res.status(400).json({ error: "Payout Account Id is required" });
    }

    // Check the payout ID
    const subAccount = await PayoutAccount.findOne({
      merchant_id: merchantId,
      id: subAccountId,
      status: true
    });

    if (!subAccount) {
      return res.status(404).json({ error: "Payout Account not found" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Payout Account not authorized" });
  }
};

module.exports = requirePayoutAccount;
