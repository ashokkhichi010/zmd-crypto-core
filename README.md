# zmd-crypto-core

`zmd-crypto-core` is a **zero-dependency, serverless, and privacy-first** cryptographic utility engine designed to handle client-side data encryption, decryption, and automatic time-expiry validation. 

Operating on a **Zero-Knowledge, Zero-Middleware Architecture**, this package executes entirely in volatile system memory. It contains zero network hooks, tracking configurations, or database pipelines, ensuring that sensitive data is managed exclusively by the user's host environment.

Current Repository Status and Issue tracking are maintained on the [Official GitHub Repository](https://github.com/ashokkhichi010/zmd-crypto-core).

---

## Key Features

*   **Zero Server Footprint**: No external API routing, backend databases, or intermediate middleware configurations.
*   **Absolute Privacy Sovereignty**: Encryption and decryption execute strictly within the local runtime context via the native Web Crypto API.
*   **Decoupled Domain Architecture**: Separate configuration blocks for public shares (integrity-focused) and private shares (confidentiality-focused).
*   **Compact, Fixed-Length Secret Keys**: Private shares utilize a short, completely fixed-length alphanumeric seed string, keeping shared keys highly portable.
*   **Chronological Expiry Enforcement**: The engine bundles microsecond-accurate expiration constraints inside the encrypted ciphertext, automatically bricking data access upon timeout.

---

## Installation

Install the package directly into your application directory via the npm registry:

```bash
npm install zmd-crypto-core
```

Alternatively, clone the repository source code directly for local development modifications:

```bash
git clone https://github.com/ashokkhichi010/zmd-crypto-core.git
```

---

## Quick Start & API Reference

### 1. Initializing the Instance
Instantiate the master control class by providing distinct operational constants for both `public` and `private` execution vectors.

```javascript
import { ZmdCryptoSystem } from 'zmd-crypto-core';

const privacyEngine = new ZmdCryptoSystem({
  public: {
    algorithm: 'AES-CBC',                     // 'AES-GCM' or 'AES-CBC'
    iterations: 80000,                        // PBKDF2 cycle operations
    salt: 'your-app-public-isolated-salt'     // Application public signature salt
  },
  private: {
    algorithm: 'AES-GCM',                     // Selected block cipher primitive
    iterations: 150000,                       // Heavy loop derivation iterations
    salt: 'your-app-highly-guarded-private-salt', // Master core private salt
    keyLengthCharacters: 16                   // Length of the short secretKey string
  }
});
```

### 2. Encrypting & Packaging Data (`encryptPayload`)
Bundle data payloads alongside a hard timeline constraint. The system automatically switches cryptographic parameters based on the chosen execution `type`.

```javascript
// Define expiration timeline (e.g., 15 minutes in the future)
const expiryTimeline = Date.now() + (15 * 60 * 1000);

// --- PRIVATE MODE ---
const privateShare = await privacyEngine.encryptPayload({
  data: 'Highly confidential system credentials matrix.',
  timestamp: expiryTimeline,
  type: 'private'
});
console.log(privateShare.encryptedData); // Output: Combined Initialization Vector + Hex Ciphertext
console.log(privateShare.secretKey);     // Output: 'x7R9wQ2pM5kL3nT1' (Fixed 16-character string)

// --- PUBLIC MODE ---
const publicShare = await privacyEngine.encryptPayload({
  data: 'Open informational broadcast vector.',
  timestamp: expiryTimeline,
  type: 'public'
});
console.log(publicShare.encryptedData); // Output: Sealed Hex Ciphertext string
console.log(publicShare.secretKey);     // Output: null (No user-held key required)
```

### 3. Decrypting & Timing Checks (`decryptPayload`)
The engine dynamically identifies the target context (Public vs Private) based on the presence of the `secretKey` argument.

```javascript
try {
  const result = await privacyEngine.decryptPayload({
    encryptedData: '0a7f23c9...', 
    secretKey: 'x7R9wQ2pM5kL3nT1' // Pass null here to decode public data types
  });
  
  console.log(result.data);            // Output: "Highly confidential system credentials matrix."
  console.log(result.expiryTimestamp); // Output: 1716440600000
} catch (error) {
  // Gracefully catches structural corruption, mismatched keys, or expired data arrays
  console.error(error.message); // e.g., "ZMD-Error: Payload has expired"
}
```

---

## Security Implementation Design Patterns

### Short Secret Key Derivation (PBKDF2 Expansion)
To eliminate the need for sharing bulky, raw cryptographic byte hashes across URLs, `zmd-crypto-core` utilizes an asynchronous key-stretching technique. 

When generating a private share, it outputs a clean, user-portable seed string of a fixed length. During runtime encryption and decryption execution, this short seed string is combined with the developer's instance-level `salt` configuration and expanded into a high-entropy 256-bit AES symmetric key inside the secure Web Crypto sandbox environment.

---

## Bug Reports & Contributions

Encountered an operational error or looking to enhance the core cryptographic primitives? Please submit an official issue or fork the repository and open a pull request via the [GitHub Issue Tracker](https://github.com/ashokkhichi010/zmd-crypto-core/issues).

---

## License

This project is open-source software distributed under the terms of the **MIT License**. 

The explicit terms can be viewed in the accompanying [LICENSE file](./LICENSE) within the root repository path. This grants absolute freedom for commercial or private software distribution with minimal legal friction.
