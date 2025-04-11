require("dotenv").config();

const { v4: uuidv4 } = require('uuid')



const baseUrl = process.env.FLW_API_URL;
const uri = 'virtual-account-numbers';

const createVirtualAccount = async (userEmail, bvn) => {
    const payload = {
        email: userEmail,
        tx_ref: uuidv4(),
        currency: "NGN",
        is_permanent: true,
        bvn: bvn
    }


    const virtualAccount = await fetch(`${baseUrl+uri}`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Accept": "rapplication/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + process.env.FLWSECK_TEST
        }
    })


    if (virtualAccount.status != 200 || virtualAccount.status != 201) {
        throw new Error(virtualAccount.statusText)
    }

    const response = await virtualAccount.json()

    return response;
}


const getVirtualAccount = async () => {

}



module.exports = {
    createVirtualAccount
}
