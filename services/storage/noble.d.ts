// Type declarations for @noble packages
// These packages use ESM subpath exports which TypeScript can't resolve with bundler module resolution

declare module '@noble/hashes/pbkdf2' {
  export function pbkdf2(
    hash: any,
    password: Uint8Array | string,
    salt: Uint8Array | string,
    opts: { c: number; dkLen: number }
  ): Uint8Array;
}

declare module '@noble/hashes/sha2' {
  export const sha256: {
    (message: Uint8Array | string): Uint8Array;
    outputLen: number;
    blockLen: number;
  };
}

declare module '@noble/ciphers/aes' {
  export function gcm(
    key: Uint8Array,
    nonce: Uint8Array,
    associatedData?: Uint8Array
  ): {
    encrypt(plaintext: Uint8Array): Uint8Array;
    decrypt(ciphertext: Uint8Array): Uint8Array;
  };
}
