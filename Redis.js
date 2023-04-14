const IoRedis = require('ioredis');

let client;
class Redis {
    constructor() {
        if(!client) {
            client = new IoRedis('redis://default:4d79b0912d5b4ff1b4ab1a5a3756e5fd@us1-secure-squid-37096.upstash.io:37096')
            this.client = client;
        } else {
            this.client = client;
        }
    }
}

module.exports = Redis;
