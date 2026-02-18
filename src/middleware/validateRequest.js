import { validationResult } from 'express-validator';

export function validateRequest(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next({
      statusCode: 400,
      message: result.array()[0].msg,
    });
  }
  next();
}
