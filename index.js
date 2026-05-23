import { 
  stringToBuffer, 
  bufferToHex, 
  hexToBuffer, 
  deriveMasterKey, 
  generateRandomString 
} from './utils.js';

import { ALGORITHMS } from './methods.js';

export class ZmdCryptoSystem {
  /**
   * Initializes the ZMD Crypto Instance with developer-defined configurations.
   * @param {Object} config - The master configuration object.
   */
  constructor(config = {}) {
    // Public Configuration Blocks
    this.publicConfig = {
      algorithm: config.public?.algorithm || 'AES-GCM',
      keyLength: config.public?.keyLength || 256,
      iterations: config.public?.iterations || 100000,
      salt: config.public?.salt || 'zmd-default-public-secure-salt-vector'
    };

    // Private Configuration Blocks
    this.privateConfig = {
      algorithm: config.private?.algorithm || 'AES-GCM',
      keyLength: config.private?.keyLength || 256,
      iterations: config.private?.iterations || 100000,
      salt: config.private?.salt || 'zmd-default-private-secure-salt-vector',
      keyLengthCharacters: config.private?.keyLengthCharacters || 16
    };
  }

  /**
   * Encrypts data and packages it alongside an expiration timestamp.
   * @param {Object} params
   * @param {string} params.data - Raw text message.
   * @param {number} params.timestamp - Unix expiration time in milliseconds.
   * @param {string} params.type - 'public' or 'private'.
   */
  async encryptPayload({ data, timestamp, type }) {
    if (!data || !timestamp || !type) {
      throw new Error('ZMD-Error: Missing required parameters (data, timestamp, type)');
    }

    const payloadString = `${data}||${timestamp}`;
    const dataBuffer = stringToBuffer(payloadString);

    if (type === 'public') {
      const config = this.publicConfig;
      const algoTarget = ALGORITHMS[config.algorithm];
      
      if (!algoTarget) throw new Error(`ZMD-Error: Unsupported public algorithm ${config.algorithm}`);

      const cryptoKey = await deriveMasterKey(config.salt, config.salt, config.iterations, config.keyLength, config.algorithm);
      const iv = crypto.getRandomValues(new Uint8Array(algoTarget.ivLength));
      
      const cipherBuffer = await crypto.subtle.encrypt(
        { name: config.algorithm, ...algoTarget.getParams(iv) },
        cryptoKey,
        dataBuffer
      );

      const combinedHex = bufferToHex(iv) + bufferToHex(new Uint8Array(cipherBuffer));
      return { encryptedData: combinedHex, secretKey: null };
    } 
    
    if (type === 'private') {
      const config = this.privateConfig;
      const algoTarget = ALGORITHMS[config.algorithm];

      if (!algoTarget) throw new Error(`ZMD-Error: Unsupported private algorithm ${config.algorithm}`);

      // Generate localized, fixed-length random secret seed string
      const rawSecretKey = generateRandomString(config.keyLengthCharacters);
      
      // Combine developer salt and runtime secret key seed to prevent structural pre-computation attacks
      const compositeSalt = `${config.salt}||${rawSecretKey}`;
      
      const cryptoKey = await deriveMasterKey(rawSecretKey, compositeSalt, config.iterations, config.keyLength, config.algorithm);
      const iv = crypto.getRandomValues(new Uint8Array(algoTarget.ivLength));

      const cipherBuffer = await crypto.subtle.encrypt(
        { name: config.algorithm, ...algoTarget.getParams(iv) },
        cryptoKey,
        dataBuffer
      );

      const combinedHex = bufferToHex(iv) + bufferToHex(new Uint8Array(cipherBuffer));
      return { encryptedData: combinedHex, secretKey: rawSecretKey };
    }

    throw new Error('ZMD-Error: Invalid transmission type specified. Use "public" or "private".');
  }

  /**
   * Decrypts payloads and evaluates chronological expiration constraints.
   * @param {Object} params
   * @param {string} params.encryptedData - Combined hexadecimal payload string.
   * @param {string|null} params.secretKey - Generated user secret string or null.
   */
  async decryptPayload({ encryptedData, secretKey }) {
    if (!encryptedData) {
      throw new Error('ZMD-Error: Missing encryptedData parameter');
    }

    // Context switching based on secretKey payload presence
    const isPrivate = secretKey !== null && secretKey !== undefined;
    const config = isPrivate ? this.privateConfig : this.publicConfig;
    const algoTarget = ALGORITHMS[config.algorithm];

    if (!algoTarget) throw new Error(`ZMD-Error: Unsupported decryption algorithm ${config.algorithm}`);

    try {
      const rawBuffer = hexToBuffer(encryptedData);
      const ivLengthBytes = algoTarget.ivLength;
      
      const iv = rawBuffer.slice(0, ivLengthBytes);
      const cipherText = rawBuffer.slice(ivLengthBytes);

      let cryptoKey;
      if (isPrivate) {
        const compositeSalt = `${config.salt}||${secretKey}`;
        cryptoKey = await deriveMasterKey(secretKey, compositeSalt, config.iterations, config.keyLength, config.algorithm);
      } else {
        cryptoKey = await deriveMasterKey(config.salt, config.salt, config.iterations, config.keyLength, config.algorithm);
      }

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: config.algorithm, ...algoTarget.getParams(iv) },
        cryptoKey,
        cipherText
      );

      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      const delimiterIndex = decryptedString.lastIndexOf('||');
      
      if (delimiterIndex === -1) {
        throw new Error('ZMD-Error: Corrupted structural payload packaging');
      }

      const data = decryptedString.substring(0, delimiterIndex);
      const expiryTimestamp = parseInt(decryptedString.substring(delimiterIndex + 2), 10);

      // Realtime validation engine
      if (Date.now() >= expiryTimestamp) {
        throw new Error('ZMD-Error: Payload has expired');
      }

      return { data, expiryTimestamp };
    } catch (error) {
      if (error.message.includes('expired')) throw error;
      throw new Error('ZMD-Error: Decryption operation failed. Check key integrity or configuration constants.');
    }
  }
}
