// Description: It has all the functions related to merchant.
const Merchant = require("../schema/merchantSchema");

const getAllMerchants = async (req, res) => {
    try {
        const merchants = await Merchant.allMerchants();
        return res.status(200).json(merchants);
    }catch(error){
        res.status(400).json({ error: error.message });
    }
};


const loadTestMerchants = async (req, res) => {
    try {
        const merchants = {
            "merchants": [
                {
                    "name": "Merchant 1",
                    "state": "Lagos",
                    "city": "Surulere",
                    "address": "Adeniran Ogunsanya St, Surulere, Lagos 101241, Lagos",
                    "logo": "logo1.png",
                    "admins": ["admin_id"],
                    "lat": "6.494678803696833",
                    "lng": "3.3558995475171507"
                },
                {
                    "name": "Merchant 2",
                    "state": "Lagos",
                    "city": "Surulere",
                    "address": "230 Adetola St, Ijesha Tedo, Aguda 101241, Lagos",
                    "logo": "logo2.png",
                    "admins": ["admin_id"],
                    "lat": "6.4847895656961745",
                    "lng": "3.3320387227558332"
                },
                {
                    "name": "Merchant 3",
                    "state": "Lagos",
                    "city": "Surulere",
                    "address": "Adeniran Ogunsanya St, Surulere, Lagos 101211, Lagos",
                    "logo": "logo3.png",
                    "admins": ["admin_id"],
                    "lat": "6.490643283502076",
                    "lng": " 3.3574483460332027"
                }
            ]
        };

        merchants.merchants.forEach(element => {
            Merchant.create(element);
        });

        return res.status(200).json(merchants);
    }catch(error){
        res.status(400).json({ error: error.message });
    }
};
  
module.exports = { getAllMerchants, loadTestMerchants };