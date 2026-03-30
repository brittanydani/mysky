// CJS mock for @noble/hashes/hmac (ESM package that Jest can't process)
const crypto = require('crypto');

class _HMAC {
  constructor(hash, key) {
    this._hmac = crypto.createHmac('sha256', Buffer.from(key));
  }
  update(data) {
    this._hmac.update(Buffer.from(data));
    return this;
  }
  digest() {
    return new Uint8Array(this._hmac.digest());
  }
}

const hmac = (hash, key, message) => new _HMAC(hash, key).update(message).digest();

module.exports = { hmac, _HMAC };
