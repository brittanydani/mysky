// CJS mock for @noble/hashes/sha2 (ESM package that Jest can't process)
const crypto = require('crypto');

const sha256 = Object.assign(
  (data) => new Uint8Array(crypto.createHash('sha256').update(Buffer.from(data)).digest()),
  {
    blockLen: 64,
    outputLen: 32,
    create: () => {
      const h = crypto.createHash('sha256');
      return {
        update(data) { h.update(Buffer.from(data)); return this; },
        digest() { return new Uint8Array(h.digest()); },
        destroy() {},
      };
    },
  }
);

module.exports = { sha256 };
