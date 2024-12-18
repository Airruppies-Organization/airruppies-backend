require("dotenv").config();
const crypto = require("crypto");

class Encrypt {
  #algo;
  #key;
  #iv;

  constructor() {
    this.#algo = process.env.ALGO || "aes-256-cbc"; // Default to AES-256-CBC

    const key = process.env.ENCRYPT_KEY;
    if (!key || key.length !== 64) {
      throw new Error(
        "Invalid ENCRYPT_KEY. It must be a 32-byte (64-character) hexadecimal string."
      );
    }

    this.#key = Buffer.from(key, "hex"); // Ensure the key is a Buffer
  }

  encrypt(data) {
    this.#iv = crypto.randomBytes(16); // Generate a new IV for each encryption

    const cipher = crypto.createCipheriv(this.#algo, this.#key, this.#iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      iv: this.#iv.toString("hex"), // Include IV for decryption
      encryptedData: encrypted, // No need to call .toString("hex") again
    };
  }

  decrypt(data) {
    const iv = Buffer.from(data.iv, "hex"); // Convert IV back to Buffer
    const encryptedText = Buffer.from(data.encryptedData, "hex");

    const decipher = crypto.createDecipheriv(this.#algo, this.#key, iv);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted; // Return the decrypted string
  }
}

const encrypter = new Encrypt();

module.exports = encrypter;
