const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-key-that-is-very-secure-must-be-long';

// Generate base64 url-safe signature
async function signData(data, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  // Use globalThis.crypto or crypto (supports Edge & Node.js environment)
  const subtle = typeof crypto !== 'undefined' && crypto.subtle 
    ? crypto.subtle 
    : globalThis.crypto?.subtle;
    
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }
  
  const cryptoKey = await subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  
  const signature = await subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(data)
  );
  
  return arrayBufferToBase64Url(signature);
}

async function verifyData(data, signature, secret) {
  const expectedSig = await signData(data, secret);
  return signature === expectedSig;
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create a session cookie string
export async function createSessionCookie(payload) {
  const dataStr = JSON.stringify({
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 // 1 day expiration
  });
  const signature = await signData(dataStr, SESSION_SECRET);
  const encodedData = typeof window === 'undefined'
    ? Buffer.from(dataStr).toString('base64')
    : btoa(dataStr);
  return `${encodedData}.${signature}`;
}

// Read and verify user session
export async function getSessionPayload(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedData, signature] = parts;
  
  try {
    const dataStr = typeof window === 'undefined'
      ? Buffer.from(encodedData, 'base64').toString('utf8')
      : atob(encodedData);
      
    const isValid = await verifyData(dataStr, signature, SESSION_SECRET);
    if (!isValid) return null;
    
    const payload = JSON.parse(dataStr);
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}
