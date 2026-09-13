// Set Backend API endpoint to port 5000
const API_BASE = 'http://localhost:5000/api/vault';

export interface UploadResponse {
  success: boolean;
  fileId: string;
  expiresIn: string;
}

export async function uploadVaultFile(payload: Blob, filename: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('encryptedPayload', payload, `${filename}.cypher`);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchVaultFile(fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/fetch/${fileId}`);
  if (!res.ok) {
    throw new Error('Vault file not found or expired.');
  }
  return res.arrayBuffer();
}