import { NextFunction, Request, Response } from 'express';
import { findUserById } from '../db/users.ts';
import { verifySessionToken } from '../lib/auth.ts';

export interface AuthenticatedAccount {
  id: number;
  username: string;
}

export interface AuthRequest extends Request {
  account?: AuthenticatedAccount;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty authentication token.' });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session.' });
  }

  try {
    const account = await findUserById(payload.sub);
    if (!account) {
      return res.status(401).json({ error: 'Unauthorized: Account not found.' });
    }

    req.account = {
      id: account.id,
      username: account.username,
    };
    next();
  } catch (error) {
    console.error('Authentication check failed:', error);
    return res.status(500).json({ error: 'Unable to verify session. Please try again.' });
  }
};
