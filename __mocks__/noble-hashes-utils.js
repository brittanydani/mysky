// CJS mock for @noble/hashes/utils (ESM package that Jest can't process)
const bytesToHex = (bytes) =>
  Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

module.exports = { bytesToHex };
