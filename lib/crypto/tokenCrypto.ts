import crypto from 'crypto';

// Server-only module (uses Node's `crypto`). Only ever import this from
// app/api/** route handlers, never from client components.

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.CONNECTIONS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'CONNECTIONS_ENCRYPTION_KEY is not set. Generate one with `openssl rand -hex 32` and add it to your environment variables.'
    );
  }
  // Accepts a 64-char hex string (32 bytes) as recommended in .env.example.
  const key = Buffer.from(secret, 'hex');
  if (key.length !== 32) {
    throw new Error('CONNECTIONS_ENCRYPTION_KEY must be a 32-byte value encoded as 64 hex characters.');
  }
  return key;
}

/** Encrypts a plaintext token. Output format: iv:authTag:ciphertext (all hex). */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(payload: string): string {
  const key = getKey();
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Malformed encrypted token payload.');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
