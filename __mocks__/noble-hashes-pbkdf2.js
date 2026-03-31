// CJS mock for @noble/hashes/pbkdf2 (ESM package that Jest can't process)
// Returns deterministic bytes for testing: sha256(passphrase || salt), zero-padded to dkLen.
const crypto = require('crypto');

/**
 * Sync PBKDF2 using Node's built-in crypto.
 * Intentionally uses a very small iteration count in tests (the source passes KDF_ITERATIONS
 * but we ignore that here to avoid making tests slow).
 */
function pbkdf2(hash, password, salt, opts) {
  const { c = 1, dkLen = 32 } = opts ?? {};
  const pass = Buffer.isBuffer(password) ? password : Buffer.from(password);
  const s = Buffer.isBuffer(salt) ? salt : Buffer.from(salt);
  return new Uint8Array(crypto.pbkdf2Sync(pass, s, Math.min(c, 1000), dkLen, 'sha256'));
}

async function pbkdf2Async(hash, password, salt, opts) {
  return pbkdf2(hash, password, salt, opts);
}

module.exports = { pbkdf2, pbkdf2Async };
