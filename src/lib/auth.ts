import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

const EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSigningSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : EPHEMERAL_SECRET;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;

  const expectedKey = Buffer.from(keyHex, 'hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;

  if (expectedKey.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(expectedKey, derivedKey);
}

interface TokenPayload {
  sub: number;
  username: string;
  exp: number;
}

export function createSessionToken(userId: number, username: string): string {
  const payload: TokenPayload = {
    sub: userId,
    username,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encodedPayload)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as Partial<TokenPayload>;

    if (
      typeof decoded.sub !== 'number' ||
      typeof decoded.username !== 'string' ||
      typeof decoded.exp !== 'number'
    ) {
      return null;
    }

    if (decoded.exp < Date.now()) {
      return null;
    }

    return {
      sub: decoded.sub,
      username: decoded.username,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}
