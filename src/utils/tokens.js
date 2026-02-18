import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    },
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
    },
    env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
