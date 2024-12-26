require('dotenv').config();
const crypto = require('crypto');

class Encrypt {
    #algo;
    #key;
    #iv;

    constructor() {
        this.#algo = process.env.ALGO;
        this.#key = process.env.KEY;
        this.#iv = crypto.randomBytes(16);
    }

    encrypt(data) {
        const cipher = crypto.createCipheriv(this.#algo, Buffer.from(this.#key), this.#iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { iv: this.#iv.toString('hex'), encryptedData: encrypted.toString('hex') };
    }

    decrypt(data) {
        const iv = Buffer.from(data.iv, 'hex');
        const encryptedText = Buffer.from(data.encryptedData, 'hex');
        const decipher = crypto.createDecipheriv(this.#algo, Buffer.from(this.#key), iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted.toString();
    }

}

const encrypter = new Encrypt();

module.exports = encrypter;