// Type declarations for @noble/hashes subpath imports
// The package exports use .js extensions but our imports omit them

declare module '@noble/hashes/hmac' {
  export { hmac } from '@noble/hashes/hmac.js';
}

declare module '@noble/hashes/sha2' {
  export { sha256, sha512 } from '@noble/hashes/sha2.js';
}

declare module '@noble/hashes/pbkdf2' {
  export { pbkdf2, pbkdf2Async } from '@noble/hashes/pbkdf2.js';
}

declare module '@noble/hashes/utils' {
  export { bytesToHex, hexToBytes, utf8ToBytes, concatBytes } from '@noble/hashes/utils.js';
}
