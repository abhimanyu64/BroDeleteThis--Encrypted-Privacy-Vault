/**
 * Character pool for generating the high-entropy 16-character secret key.
 * Excludes easily confusable characters (like 0, O, 1, l, I).
 */
const CHAR_SET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';

/**
 * Generates a cryptographically strong 16-character alphanumeric/symbolic secret key.
 * @param {number} length 
 * @returns {string}
 */
function generateSecretKey(length = 16) {
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (n) => CHAR_SET[n % CHAR_SET.length]).join('');
}

/**
 * Derives a 256-bit AES-GCM CryptoKey using PBKDF2 with SHA-256 (150,000 iterations).
 * @param {string} combinedSecret - (Secret Key + 6-digit PIN)
 * @param {Uint8Array} salt - Unique 16-byte random salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(combinedSecret, salt) {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(combinedSecret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 150000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts any binary file into a self-contained .cypher payload.
 * Binary format: [4-Byte Meta Length | Meta JSON UTF-8 | 16-Byte Salt | 12-Byte IV | AES-GCM Ciphertext]
 * 
 * @param {File} file - Original browser File object
 * @param {string} pin - User's 6-digit PIN
 * @returns {Promise<{payload: Blob, secretKey: string}>}
 */
async function encryptFile(file, pin) {
  // 1. Generate random credentials & vectors
  const secretKey = generateSecretKey(16);
  const combinedSecret = secretKey + pin;
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 2. Read file as ArrayBuffer & derive AES key
  const fileBuffer = await file.arrayBuffer();
  const derivedKey = await deriveKey(combinedSecret, salt);

  // 3. Encrypt file buffer with AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    fileBuffer
  );

  // 4. Serialize file metadata (original filename, MIME type, size)
  const metaObj = {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size
  };
  const metaEncoded = new TextEncoder().encode(JSON.stringify(metaObj));
  const metaLengthHeader = new Uint32Array([metaEncoded.byteLength]);

  // 5. Pack binary bundle into Blob
  const payload = new Blob(
    [metaLengthHeader, metaEncoded, salt, iv, ciphertextBuffer],
    { type: 'application/octet-stream' }
  );

  return { payload, secretKey };
}

/**
 * Unpacks and decrypts a .cypher payload back into the original file.
 * 
 * @param {ArrayBuffer} arrayBuffer - Raw encrypted binary buffer
 * @param {string} secretKey - 16-character Secret Key
 * @param {string} pin - 6-digit PIN
 * @returns {Promise<{blob: Blob, meta: {name: string, type: string, size: number}}>}
 */
async function decryptFile(arrayBuffer, secretKey, pin) {
  // 1. Read 4-byte header to get metadata length
  const metaLength = new Uint32Array(arrayBuffer.slice(0, 4))[0];

  // 2. Extract and parse metadata JSON
  const metaBytes = new Uint8Array(arrayBuffer.slice(4, 4 + metaLength));
  const meta = JSON.parse(new TextDecoder().decode(metaBytes));

  // 3. Extract salt (16 bytes), IV (12 bytes), and raw ciphertext
  const offsetSalt = 4 + metaLength;
  const salt = new Uint8Array(arrayBuffer.slice(offsetSalt, offsetSalt + 16));
  const iv = new Uint8Array(arrayBuffer.slice(offsetSalt + 16, offsetSalt + 28));
  const ciphertext = arrayBuffer.slice(offsetSalt + 28);

  // 4. Derive key using combined secret
  const combinedSecret = secretKey + pin;
  const derivedKey = await deriveKey(combinedSecret, salt);

  // 5. Decrypt via AES-GCM (auto-verifies GCM authentication tag)
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    ciphertext
  );

  // 6. Wrap raw buffer back into typed Blob
  const blob = new Blob([decryptedBuffer], { type: meta.type || 'application/octet-stream' });
  return { blob, meta };
} 