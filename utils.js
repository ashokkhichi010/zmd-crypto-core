/**
 * Converts a standard UTF-8 string to a Uint8Array byte buffer.
 */
export function stringToBuffer(str) {
  return new TextEncoder().encode(str);
}

/**
 * Transforms an array buffer byte stream into an optimized hex string.
 */
export function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Transforms an optimized hex string back to a Uint8Array byte buffer.
 */
export function hexToBuffer(hexString) {
  const matches = hexString.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Generates a localized cryptographically strong random character seed string.
 */
export function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues)
    .map(value => chars[value % chars.length])
    .join('');
}

/**
 * Cryptographically derives symmetric encryption key targets using PBKDF2 primitives.
 */
export async function deriveMasterKey(password, salt, iterations, keyLength, targetAlgorithm) {
  const passwordBuffer = stringToBuffer(password);
  const saltBuffer = stringToBuffer(salt);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: targetAlgorithm, length: keyLength },
    false,
    ['encrypt', 'decrypt']
  );
}
