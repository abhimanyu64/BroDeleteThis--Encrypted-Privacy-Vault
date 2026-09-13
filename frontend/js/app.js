// Backend API endpoint
const API_BASE = 'http://localhost:4000/api';

// 1. Upload Encrypted Payload
async function uploadToVault(encryptedBlob, originalFilename) {
  const formData = new FormData();

  formData.append(
    'vault',
    encryptedBlob,
    `${originalFilename}.cypher`
  );

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Upload failed with status ${response.status}`
    );
  }

  return await response.json();
}

// 2. Fetch Encrypted Payload
async function fetchFromVault(fileId) {
  const response = await fetch(`${API_BASE}/vault/${fileId}`);

  if (!response.ok) {
    throw new Error('Vault payload not found or has expired.');
  }

  return await response.arrayBuffer();
}