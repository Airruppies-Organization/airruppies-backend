require("dotenv").config();

const { v4: uuidv4 } = require('uuid')



const baseUrl = process.env.FLW_API_URL;
const uri = 'virtual-account-numbers';

const createStaticVirtualAccount = async (userEmail, bvn) => {
    const tx_ref = uuidv4();

    const payload = {
        email: userEmail,
        tx_ref: tx_ref,
        currency: "NGN",
        is_permanent: true,
        bvn: bvn.toString()
    }

    const virtualAccount = await fetch(`${baseUrl+uri}`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.FLWSECK_TEST
        }
    });


    if (virtualAccount.status != 200 && virtualAccount.status != 201) {
        throw new Error(virtualAccount.statusText)
    }

    const response = await virtualAccount.json()
    response.data.tx_ref = tx_ref;

    return response;
}


const createDynamicVirtualAccount = async (userEmail, amount) => {
    const tx_ref = uuidv4();

    const payload = {
        email: userEmail,
        tx_ref,
        currency: "NGN",
        amount
    }

    try{
        const virtualAccount = await fetch(`${baseUrl+uri}`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.FLWSECK_TEST
            }
        })
  
        if (virtualAccount.status != 200 && virtualAccount.status != 201) {
            throw new Error(virtualAccount.statusText)
        }
    
        const response = await virtualAccount.json()
        response.data.tx_ref = tx_ref;
    
        return response;
    }catch(err) {
        throw new Error(err.message)
    }
    
}


const bvnConsent = async () => {
    
}


module.exports = {
    createStaticVirtualAccount,
    createDynamicVirtualAccount
}
