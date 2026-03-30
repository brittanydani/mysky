// Minimal stub for expo-crypto in the Node test environment
const { webcrypto } = require('crypto');

module.exports = {
  randomUUID: () => webcrypto.randomUUID(),
  getRandomBytes: (byteCount) => webcrypto.getRandomValues(new Uint8Array(byteCount)),
  digestStringAsync: async (_algorithm, data) => {
    const encoder = new TextEncoder();
    const buf = await webcrypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },
  CryptoDigestAlgorithm: { SHA256: 'SHA-256', SHA1: 'SHA-1', MD5: 'MD5' },
  CryptoEncoding: { HEX: 'hex', BASE64: 'base64' },
};
