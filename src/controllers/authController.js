import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens.js';

const REFRESH_TOKEN_DAYS = 7;

function buildAuthPayload(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { accessToken, refreshToken };
}

async function persistRefreshToken(userId, refreshToken) {
  const tokenHash = hashToken(refreshToken);
  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked)
     VALUES (UUID(), ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), 0)`,
    [userId, tokenHash, REFRESH_TOKEN_DAYS],
  );
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const [existingRows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existingRows.length > 0) {
    throw new ApiError(409, 'Email is already in use');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  );

  const user = {
    id: result.insertId,
    name,
    email,
  };
  const tokens = buildAuthPayload(user);
  await persistRefreshToken(user.id, tokens.refreshToken);

  res.status(201).json({
    user,
    ...tokens,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email],
  );

  if (rows.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const userRow = rows[0];
  const isPasswordValid = await bcrypt.compare(password, userRow.password_hash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
  };
  const tokens = buildAuthPayload(user);
  await persistRefreshToken(user.id, tokens.refreshToken);

  res.status(200).json({
    user,
    ...tokens,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(400, 'refreshToken is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const [tokenRows] = await pool.query(
    `SELECT id, user_id
     FROM refresh_tokens
     WHERE user_id = ?
       AND token_hash = ?
       AND revoked = 0
       AND expires_at > NOW()
     LIMIT 1`,
    [payload.sub, tokenHash],
  );

  if (tokenRows.length === 0) {
    throw new ApiError(401, 'Refresh token is not recognized');
  }

  await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [tokenRows[0].id]);

  const [userRows] = await pool.query('SELECT id, name, email FROM users WHERE id = ? LIMIT 1', [
    payload.sub,
  ]);

  if (userRows.length === 0) {
    throw new ApiError(401, 'User account no longer exists');
  }

  const user = userRows[0];
  const tokens = buildAuthPayload(user);
  await persistRefreshToken(user.id, tokens.refreshToken);

  res.status(200).json({
    user,
    ...tokens,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(400, 'refreshToken is required');
  }

  const tokenHash = hashToken(refreshToken);
  await pool.query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);

  res.status(200).json({ message: 'Logged out successfully' });
});
