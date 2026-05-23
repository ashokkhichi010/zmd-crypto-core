import { ZmdCryptoSystem } from './index.js';

async function executeTestSuite() {
  console.log('🧪 Starting Native Security Integration Tests for zmd-crypto-core...\n');

  // Instantiate system with decoupled public and private operational states
  const cryptoSystem = new ZmdCryptoSystem({
    public: {
      algorithm: 'AES-CBC',
      iterations: 50000,
      salt: 'developer-public-isolated-salt-string'
    },
    private: {
      algorithm: 'AES-GCM',
      iterations: 150000,
      salt: 'developer-private-highly-guarded-salt-string',
      keyLengthCharacters: 16
    }
  });

  let assertionCount = 0;
  const assert = (condition, successMessage, failureMessage) => {
    if (!condition) throw new Error(`❌ Assertion Failed: ${failureMessage}`);
    assertionCount++;
    console.log(`  ✅ Passed: ${successMessage}`);
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Public Flow Execution
    // ----------------------------------------------------
    console.log('Test 1: Verifying Public Context Pipeline...');
    const publicTTL = Date.now() + 5000; // 5 seconds lifespan
    const publicResult = await cryptoSystem.encryptPayload({
      data: 'Standard Open Source Content Vector',
      timestamp: publicTTL,
      type: 'public'
    });

    assert(publicResult.secretKey === null, 'Public keys are set to null.', 'Public generation leaked secret string.');
    
    const publicDecrypted = await cryptoSystem.decryptPayload({
      encryptedData: publicResult.encryptedData,
      secretKey: null
    });

    assert(publicDecrypted.data === 'Standard Open Source Content Vector', 'Public payload matches input string.', 'Data corrupt.');

    // ----------------------------------------------------
    // TEST 2: Private Flow Execution
    // ----------------------------------------------------
    console.log('\nTest 2: Verifying Private Context Pipeline...');
    const privateTTL = Date.now() + 5000;
    const privateResult = await cryptoSystem.encryptPayload({
      data: 'Highly Confident Personal Information Matrix',
      timestamp: privateTTL,
      type: 'private'
    });

    assert(typeof privateResult.secretKey === 'string' && privateResult.secretKey.length === 16, 
      'Private key generated at fixed length configuration.', 'Private key sizing variable or missing.');

    const privateDecrypted = await cryptoSystem.decryptPayload({
      encryptedData: privateResult.encryptedData,
      secretKey: privateResult.secretKey
    });

    assert(privateDecrypted.data === 'Highly Confident Personal Information Matrix', 'Private payload decrypted safely.', 'Data corrupt.');

    // ----------------------------------------------------
    // TEST 3: Validation Cross-Leak Testing
    // ----------------------------------------------------
    console.log('\nTest 3: Verifying Configuration Isolation (Cross-Leaks)...');
    try {
      // Attempting to unlock private data block passing no secretKey (forcing public matrix resolution)
      await cryptoSystem.decryptPayload({
        encryptedData: privateResult.encryptedData,
        secretKey: null
      });
      throw new Error('Exploit: System cross-leaked context bounds.');
    } catch (e) {
      assert(e.message.includes('failed'), 'Public engine rejected private ciphertext securely.', 'Cross-leak vector active.');
    }

    // ----------------------------------------------------
    // TEST 4: Realtime Expiration Verification
    // ----------------------------------------------------
    console.log('\nTest 4: Evaluating Realtime Expiration Assertions...');
    const instantExpiryTTL = Date.now() - 1000; // Expired 1 second ago
    const expiredResult = await cryptoSystem.encryptPayload({
      data: 'Ephemeral Ghost Stream',
      timestamp: instantExpiryTTL,
      type: 'private'
    });

    try {
      await cryptoSystem.decryptPayload({
        encryptedData: expiredResult.encryptedData,
        secretKey: expiredResult.secretKey
      });
      throw new Error('Exploit: Expired content bypassed timing logic gates.');
    } catch (e) {
      assert(e.message.includes('expired'), 'Realtime validation gate successfully blocked expired payload.', 'Expiry timeline failure.');
    }

    console.log(`\n🎉 Test Matrix Cleared successfully! Verified ${assertionCount} strict runtime checks.`);
  } catch (error) {
    console.error('\n💥 Critical Fault Encountered In Security Suite Execution:');
    console.error(error.message);
    process.exit(1);
  }
}

executeTestSuite();
