/**
 * Internal Dictionary providing parameter mappers for supported Web Crypto primitives.
 */
export const ALGORITHMS = {
  'AES-GCM': {
    ivLength: 12, // Standard 96-bit IV configuration
    getParams: (iv) => ({ iv: iv })
  },
  'AES-CBC': {
    ivLength: 16, // Standard 128-bit block size Initialization Vector
    getParams: (iv) => ({ iv: iv })
  }
};
