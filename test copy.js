const otp = require("../airruppies-backend/lib/otp");
const mailer = require("../airruppies-backend/lib/mailer");

const redisClient = require("../airruppies-backend/lib/redis");

const encrypt = require("../airruppies-backend/lib/encrypt");


let text = "00993422023_99023__0";

let encrypted = encrypt.encrypt(text);
console.log(encrypted);
console.log("\n");

let decrypted = encrypt.decrypt(encrypted);
console.log(decrypted);
console.log("\n");


let data = {
    "encryptedData": "8e285a9b1a32d3f7e6adc8eb34b634d1c6758a95d49668fb6296dad9e05e8934",
    "iv": "e8cb227db99d0b235732a6f59c3f1f22"
};

let merchantDecrypted = encrypt.decrypt(data);

console.log(merchantDecrypted);

