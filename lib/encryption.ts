import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING = 'base64';

let keyCache: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (keyCache) return keyCache;

  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY non configurata in .env.local');
  }
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY deve essere 64 caratteri esadecimali');
  }

  keyCache = Buffer.from(keyHex, 'hex');
  return keyCache;
}

export function resetKeyCache(): void {
  keyCache = null;
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);
  const authTag = cipher.getAuthTag();

  return iv.toString(ENCODING) + ':' + authTag.toString(ENCODING) + ':' + encrypted;
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = getEncryptionKey();

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato crittografato non valido');
  }

  const iv = Buffer.from(parts[0], ENCODING);
  if (iv.length !== IV_LENGTH) {
    throw new Error('IV length non valido');
  }
  const authTag = Buffer.from(parts[1], ENCODING);
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Auth tag length non valido');
  }
  const encrypted = parts[2];

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    throw new Error('Decryption failed');
  }
}