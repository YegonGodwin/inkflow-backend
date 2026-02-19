import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createEssayFromOutline,
  createInsight,
  deleteInsight,
  followTopic,
  generateBrief,
  generateOutline,
  listInsights,
  listTopics,
  unfollowTopic,
  updateInsight,
} from '../controllers/technologyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const priorities = ['low', 'medium', 'high'];
const statuses = ['Collected', 'Analyzed', 'Drafted'];

router.use(requireAuth);

router.get('/topics', listTopics);

router.post(
  '/topics/:topicId/follow',
  [
    param('topicId').isUUID().withMessage('topicId must be a valid UUID'),
    body('priority').optional().isIn(priorities).withMessage('priority must be low, medium, or high'),
    validateRequest,
  ],
  followTopic,
);

router.delete(
  '/topics/:topicId/follow',
  [param('topicId').isUUID().withMessage('topicId must be a valid UUID'), validateRequest],
  unfollowTopic,
);

router.get(
  '/insights',
  [
    query('topicId').optional().isUUID().withMessage('topicId must be a valid UUID'),
    query('status').optional().isIn(statuses).withMessage('status must be Collected, Analyzed, or Drafted'),
    query('q').optional().isString().isLength({ max: 200 }).withMessage('q must be up to 200 chars'),
    validateRequest,
  ],
  listInsights,
);

router.post(
  '/insights',
  [
    body('topicId').isUUID().withMessage('topicId is required'),
    body('title').isString().trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
    body('content')
      .isString()
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Content must be 1-10000 chars'),
    body('sourceUrl').optional({ nullable: true }).isURL().withMessage('sourceUrl must be a valid URL'),
    body('tags').optional().isArray().withMessage('tags must be an array'),
    body('status').optional().isIn(statuses).withMessage('status must be Collected, Analyzed, or Drafted'),
    validateRequest,
  ],
  createInsight,
);

router.put(
  '/insights/:insightId',
  [
    param('insightId').isUUID().withMessage('insightId must be a valid UUID'),
    body('topicId').optional().isUUID().withMessage('topicId must be a valid UUID'),
    body('title').optional().isString().trim().isLength({ min: 1, max: 180 }).withMessage('Invalid title'),
    body('content')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Invalid content'),
    body('sourceUrl').optional({ nullable: true }).isURL().withMessage('sourceUrl must be a valid URL'),
    body('tags').optional().isArray().withMessage('tags must be an array'),
    body('status').optional().isIn(statuses).withMessage('status must be Collected, Analyzed, or Drafted'),
    body().custom((value) => {
      const allowedKeys = ['topicId', 'title', 'content', 'sourceUrl', 'tags', 'status'];
      const hasAny = allowedKeys.some((key) => Object.prototype.hasOwnProperty.call(value, key));
      if (!hasAny) {
        throw new Error('At least one field is required');
      }
      return true;
    }),
    validateRequest,
  ],
  updateInsight,
);

router.delete(
  '/insights/:insightId',
  [param('insightId').isUUID().withMessage('insightId must be a valid UUID'), validateRequest],
  deleteInsight,
);

router.post(
  '/briefs',
  [
    body('topicId').isUUID().withMessage('topicId is required'),
    body('insightIds').isArray({ min: 1 }).withMessage('insightIds must be a non-empty array'),
    body('insightIds.*').isUUID().withMessage('Each insightId must be a valid UUID'),
    validateRequest,
  ],
  generateBrief,
);

router.post(
  '/outlines',
  [
    body('topicId').isUUID().withMessage('topicId is required'),
    body('briefId').isUUID().withMessage('briefId is required'),
    body('tone').optional().isString().isLength({ min: 2, max: 40 }).withMessage('Invalid tone'),
    body('targetLength').optional().isInt({ min: 300, max: 5000 }).withMessage('Invalid targetLength'),
    validateRequest,
  ],
  generateOutline,
);

router.post(
  '/outlines/:outlineId/create-essay',
  [param('outlineId').isUUID().withMessage('outlineId must be a valid UUID'), validateRequest],
  createEssayFromOutline,
);

export default router;
