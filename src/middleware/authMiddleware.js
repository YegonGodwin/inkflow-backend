import { ApiError } from '../utils/apiError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or invalid Authorization header'));
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return next(new ApiError(401, 'Missing access token'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }
}
