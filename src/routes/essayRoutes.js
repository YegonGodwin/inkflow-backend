import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createEssay,
  deleteEssay,
  getEssayById,
  improveEssay,
  listEssays,
  updateEssay,
} from '../controllers/essayController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const statuses = ['Drafting', 'In Review', 'Ready'];

router.use(requireAuth);

router.get('/', listEssays);

router.get(
  '/:essayId',
  [param('essayId').isUUID().withMessage('essayId must be a valid UUID'), validateRequest],
  getEssayById,
);

router.post(
  '/',
  [
    body('title').isString().trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
    body('content').isString().withMessage('Content is required'),
    body('status').isIn(statuses).withMessage('Status must be Drafting, In Review, or Ready'),
    validateRequest,
  ],
  createEssay,
);

router.put(
  '/:essayId',
  [
    param('essayId').isUUID().withMessage('essayId must be a valid UUID'),
    body('title').isString().trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
    body('content').isString().withMessage('Content is required'),
    body('status').isIn(statuses).withMessage('Status must be Drafting, In Review, or Ready'),
    validateRequest,
  ],
  updateEssay,
);

router.delete(
  '/:essayId',
  [param('essayId').isUUID().withMessage('essayId must be a valid UUID'), validateRequest],
  deleteEssay,
);

router.post(
  '/:essayId/improve',
  [param('essayId').isUUID().withMessage('essayId must be a valid UUID'), validateRequest],
  improveEssay,
);

export default router;
