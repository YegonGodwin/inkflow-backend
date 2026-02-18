import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, refresh, register } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Valid name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8, max: 72 })
      .withMessage('Password must be 8-72 characters long'),
    validateRequest,
  ],
  register,
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  login,
);

router.post(
  '/refresh',
  [body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'), validateRequest],
  refresh,
);

router.post(
  '/logout',
  [body('refreshToken').isString().notEmpty().withMessage('refreshToken is required'), validateRequest],
  logout,
);

export default router;
