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


const verifyTransaction = async (transID, res) => {
    if (!transID) {
        res.status(400);
        throw new Error("Transaction ID is required");
    }

    const url = `${baseUrl}${transID}/verify`

    const response =  await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.FLWSEC_LIVE
            }
        })

    if (!response.ok) {
        res.status(400)
        throw new Error(response.statusText)
    }

    const jsonResponse = await response.json();

    const {data} = jsonResponse;

    if (data.status !== "successful") {
        res.status(400)
        throw new Error("Transaction not yet confirmed");
    }

    return data;   
}



const refundTransaction = async (transID, res) => {
    if (!transID) {
        res.status(400);
        throw new Error("Transaction reference is required");
    }

    const url = `${baseUrl}${transID}/refund`

    const response =  await fetch(url, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer " + process.env.FLWSEC_LIVE
            }
        })
    
    if (!response.ok) {
        res.status(400)
        throw new Error(response.statusText)
    }
    
    const jsonResponse = await response.json();

    const {data} = jsonResponse;

    if (data.status !== "completed") {
        res.status(400)
        throw new Error("Refund is still processing");
    }

    return data;   
}

const flwBanks = async (res) => {
    const url = `${baseUrl}banks/NG`;
    const response =  await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.FLWSEC_LIVE
        }
    })

    if (!response.ok) {
        res.status(400);
        throw new Error(response.statusText)
    }

    const jsonResponse = await response.json();

    const {data} = jsonResponse;

    return data;

}


const tokenizedCharge = async (res, token, email, country, amount, tx_ref, first_name, last_name, subaccount = NULL) => {
    const url = `${baseUrl}banks/tokenized-charges`;

    const payload = {
        token,
        email,
        country,
        amount,
        tx_ref,
        first_name,
        last_name
    }

    if (subaccount) {
        payload.subaccount = subaccount
    }

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.FLWSEC_LIVE
        }
    })

    if (!response.ok) {
        res.status(400)
        throw new Error(response.statusText)
    }

    const jsonResponse = await response.json();

    const { data } = jsonResponse;

    return data;
}


const addSubAccount = async (res, account_number, account_bank, business_name, country, split_value, business_mobile, business_email, split_type) => {
    const url = `${baseUrl}banks/subaccounts`;

    const payload = {
        account_bank,
        account_number,
        business_name,
        country,
        split_value,
        business_mobile,
        business_email,
        split_type
    }

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.FLWSEC_LIVE
        }
    })

    if (!response.ok) {
        res.status(400)
        throw new Error(response.statusText)
    }

    const jsonResponse = await response.json();

    const { data } = jsonResponse;

    return data;
}


module.exports = {
    createStaticVirtualAccount,
    createDynamicVirtualAccount,
    verifyTransaction,
    refundTransaction,
    flwBanks,
    tokenizedCharge,
    addSubAccount
}
