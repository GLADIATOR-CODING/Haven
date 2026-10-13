import crypto from 'crypto';
import { env } from '../config/env.js';

export function normalizeSecretString(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function hashSecret(value) {
  const normalized = normalizeSecretString(value);
  return crypto.createHmac('sha256', env.HMAC_SECRET).update(normalized).digest('hex');
}

export function compareSecret(candidate, storedHash) {
  if (!candidate || !storedHash) return false;
  const candidateHash = hashSecret(candidate);
  return crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(storedHash));
}
