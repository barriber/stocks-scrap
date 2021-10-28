const IoRedis = require('ioredis');

let client;
class Redis {
    constructor() {
        if(!client) {
            client = new IoRedis('redis://:fa49927313d941a8a2885f9002be1b45@eu1-modern-quagga-33234.upstash.io:33234')
            this.client = client;
        } else {
            this.client = client;
        }
    }

    async setValue(key, value) {
        await this.client.set(key, value)
    }

    async getValue(key) {
        return await this.client.get(key);
    }
}

module.exports = Redis;
