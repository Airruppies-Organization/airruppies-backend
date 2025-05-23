const {
    verifyTransaction,
    refundTransaction,
    flwBanks,
    tokenizedCharge
} = require("../lib/flutterwave")


const Card = require('../schema/cardSchema')
const { validateBody } = require("../lib/validator");
const PayoutAccount = require("../schema/payoutAccountSchema");

const getBanks = async (req, res) => {
    try{
        const banks = await flwBanks();

        return res.status(200).json({
            message: "All Banks",
            data: banks
        });

    }catch(error) {
        return res.status(400).json({
            message: error.message
        })
    }
}

const cardTransaction = async (req, res) => {
    try{
        const {
            subAccountId,
            amount,
            merchantId
        } = req.body


        const user_id = req.user

        /// Validate the body

        const rule = {
          subAccountId: ['required', 'number'],
          amount: ['required', 'number'],
          merchantId: ['required', 'string']
        }

        await validateBody(req.body, rule);
        /// Use Flutterwave to process the payment

        /// Get the SubAccount

        const subaccount = await PayoutAccount.find({
                              merchant_id: merchantId,
                              id: subAccountId,
                              status: true
                           });

        
        if (!subaccount) {
          res.status(404);
          throw new Error("Payout Account Not Authorized");
        }
  
        /// Get the token
        const userCard = await Card.find({
          user_id: user_id
        });

        if (!userCard.id) {
          res.status(404);
          throw new Error("User Card not found");
        }
 
        const { token } = userCard.token();

        const {customerName} = userCard;

        const names = customerName.split(" ");

        const firstname = names[0] ? names[0] : "";
        const lastname = names[1] ? names[1] : "";

        const payment = await tokenizedCharge(res, token, userCard.email, "Nigeria", amount, userCard.tx_ref, firstname, lastname, subaccount.flwID);

        return res.status(201).json({
          message: "Payment Done",
          data: payment
        });
    }catch(error){
        return res.json({
          message: error.message
        })
    }
}


const addCard = async (req, res) => {
    try{
      const { transactionId } = req.body;
  
      const userId = req.user;
  
      if (!transactionReference) {
        res.status(404);
        throw new Error("Transaction Reference is required");
      }

      //// VERIFY THE TRANSACTION

      const transaction = await verifyTransaction(transactionId, res);

      if (transaction.status == "successful") {
        ///// REFUND THE TRANSACTION AND SAVE THE CARD

        await refundTransaction(transactionId, res);
        const { expiry } = transaction.card;
        const month = expiry.split("/")[0];
        const year = expiry.split("/")[1];
    
        const card = new Card({
            user_id: userId,
            tx_ref: transaction.tx_ref,
            email: transaction.customer.email,
            bin: transaction.card.first_6digits,
            last4: transaction.card.last_4digits,
            expMonth: month,
            expYear: year,
            cardToken: transaction.card.token,
            customerName: transaction.customer.name,
            cardType: transaction.card.type
        })

        await card.save();

        return res.status(400).json({
            message: "Card added successfully",
            data: card.details()
        })
      }
      else {
        res.status(400);
        throw new Error("Transaction not verified yet");
      }  
    }catch(error){
      return res.json({
        message: error.message
      })
    }
}

const getCards = async (req, res) => {
  try{
    const user = req.user;

    ///// get the users saved cards

    const cards = await Card.find({user_id: user});

    if (!cards) {
      res.status(404);
      throw new Error('Cards not found');
    }

    return res.status(200).json({
      cards
    });

  }catch(error) {
    return res.json({error});
  }
}

module.exports = {
  addCard,
  cardTransaction,
  getBanks,
  getCards
}