import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createConcept,
  deleteConcept,
  getConceptById,
  listConcepts,
  updateConcept,
} from '../controllers/conceptController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const categories = [
  'Biology',
  'Chemistry',
  'Physics',
  'Computer Science',
  'Mathematics',
  'General Science',
];

router.use(requireAuth);

router.get('/', listConcepts);

router.get(
  '/:conceptId',
  [param('conceptId').isUUID().withMessage('conceptId must be a valid UUID'), validateRequest],
  getConceptById,
);

router.post(
  '/',
  [
    body('title').isString().trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
    body('category').isIn(categories).withMessage('Invalid concept category'),
    body('definition').isString().trim().notEmpty().withMessage('Definition is required'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    validateRequest,
  ],
  createConcept,
);

router.put(
  '/:conceptId',
  [
    param('conceptId').isUUID().withMessage('conceptId must be a valid UUID'),
    body('title').isString().trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
    body('category').isIn(categories).withMessage('Invalid concept category'),
    body('definition').isString().trim().notEmpty().withMessage('Definition is required'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    validateRequest,
  ],
  updateConcept,
);

router.delete(
  '/:conceptId',
  [param('conceptId').isUUID().withMessage('conceptId must be a valid UUID'), validateRequest],
  deleteConcept,
);

export default router;
