export interface EncryptedPackage {
    payload: Blob; // Contains: Salt (16B) + IV (12B) + Metadata Length (4B) + Metadata JSON + Ciphertext
}
