const { createClient } = require("redis");
const { promisify } = require("util");

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.connect();
    this.isConnected = true;

    this.client.on("error", (error) => {
      // console.log(`Redis client not connected to the server: ${error.message}`);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      this.isConnected = true;
    });
  }

  isAlive() {
    return this.isConnected;
  }

  async get(key) {
    await promisify(this.client.get).bind(this.client)(key);
  }

  async set(key, value, duration) {
    await promisify(this.client.SETEX).bind(this.client)(key, duration, value);
  }

  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
