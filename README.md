# zmd-crypto-core

`zmd-crypto-core` is a **zero-dependency, serverless, and privacy-first** cryptographic utility engine designed to handle client-side data encryption, decryption, and automatic time-expiry validation. 

Operating on a **Zero-Knowledge, Zero-Middleware Architecture**, this package executes entirely in volatile system memory. It contains zero network hooks, tracking configurations, or database pipelines, ensuring that sensitive data is managed exclusively by the user's host environment.

Current Repository Status and Issues can be tracked on our [Official GitHub Repository](http://github.com/ashokkhichi010/zmd-crypto-core).

---

## Key Features

*   **Zero Server Footprint**: No external API routing, backend servers, or third-party middleware components.
*   **Absolute Privacy Sovereignty**: Encryption and decryption execute strictly within the user's local runtime context via the native Web Crypto API.
*   **Dual-State Domain Architecture**: Separate configuration spaces for public shares (integrity-focused) and private shares (confidentiality-focused).
*   **Compact, Fixed-Length Secret Keys**: Private shares use a short, customizable, completely fixed-length alphanumeric seed string, keeping keys highly portable.
*   **Chronological Expiry Enforcement**: The engine packages microsecond-accurate time constraints inside the ciphertext payload, automatically bricking data access upon timeout.

---

## Installation

Install the package directly into your application directory via the npm registry:

```bash
npm install zmd-crypto-core
```

Alternatively, clone the repository directly from source for development modifications:

```bash
git clone http://github.com/ashokkhichi010/zmd-crypto-core.git
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
    salt: 'your-app-public-isolated-salt'     // Application signature key
  },
  private: {
    algorithm: 'AES-GCM',                     // Selected block primitive
    iterations: 150000,                       // Heavy loop derivation pass
    salt: 'your-app-highly-guarded-private-salt', // Master core salt
    keyLengthCharacters: 16                   // Length of the short secretKey string
  }
});
```

### 2. Encrypting & Packaging Data (`encryptPayload`)
Bundle data payloads alongside a hard timeline constraint. The method automatically chooses the encryption configuration based on the `type` parameter.

```javascript
// Set expiration time for 15 minutes in the future
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
The engine seamlessly identifies the target context (Public vs Private) based on the presence of the `secretKey` argument.

```javascript
try {
  const result = await privacyEngine.decryptPayload({
    encryptedData: '0a7f23c9...', 
    secretKey: 'x7R9wQ2pM5kL3nT1' // Pass null here for public data types
  });
  
  console.log(result.data);            // Output: "Highly confidential system credentials matrix."
  console.log(result.expiryTimestamp); // Output: 1716440600000
} catch (error) {
  // Gracefully handles structural corruption, wrong keys, or expired data strings
  console.error(error.message); // e.g., "ZMD-Error: Payload has expired"
}
```

---

## Security Implementation Design Patterns

### Short Secret Key Derivation (PBKDF2 Expansion)
To avoid transferring bulky raw byte streams, keys, or cryptographic hashes, `zmd-crypto-core` implements an asynchronous key-stretching technique. 

When generating a private share, it builds a simple, alphanumeric user-key string. During encryption and decryption, this short seed string is cryptographically combined with the developer's `fixedPrivateSalt` and stretched into a high-entropy 256-bit AES master key inside the Web Crypto sandbox. This keeps keys short and portable for easy sharing while keeping data safe from brute-force attempts.

---

## Bug Reports & Contributions

Found a bug or want to enhance the cryptographic engine? Please open an issue or submit a pull request through our [GitHub Issue Tracker](http://github.com/ashokkhichi010/zmd-crypto-core/issues).

---

## License

This project is distributed under the terms of the **GNU General Public License v3.0 (GPL-3.0-or-later)**. 

The full license text can be viewed directly in the [LICENSE file](./LICENSE) contained within this repository root. This copyleft protection ensures all variations or extensions of this privacy code base remain forever free and public.
