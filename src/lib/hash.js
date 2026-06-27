import crypto from 'crypto';

const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hashes a password using PBKDF2 with a random salt.
 * Output format: pbkdf2:salt:hash
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verifies a password against a hash string.
 * Supports legacy SHA-256 plain hash for backward compatibility.
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  // If new format (pbkdf2:salt:hash)
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [_, salt, hash] = parts;
    const testHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    return testHash === hash;
  }

  // Fallback to legacy SHA-256
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  return sha256Hash === storedHash;
}

