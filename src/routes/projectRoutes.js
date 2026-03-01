import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '../controllers/projectController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const statuses = ['Idea', 'Planning', 'In Progress', 'Completed', 'On Hold'];
const priorities = ['Low', 'Medium', 'High'];

router.use(requireAuth);

router.get('/', listProjects);

router.post(
  '/',
  [
    body('title').isString().trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
    body('description').isString().trim().notEmpty().withMessage('Description is required'),
    body('status').optional().isIn(statuses).withMessage('Invalid status'),
    body('priority').optional().isIn(priorities).withMessage('Invalid priority'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('resources').optional().isArray().withMessage('Resources must be an array'),
    validateRequest,
  ],
  createProject,
);

router.put(
  '/:projectId',
  [
    param('projectId').isUUID().withMessage('projectId must be a valid UUID'),
    body('title').isString().trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
    body('description').isString().trim().notEmpty().withMessage('Description is required'),
    body('status').optional().isIn(statuses).withMessage('Invalid status'),
    body('priority').optional().isIn(priorities).withMessage('Invalid priority'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('resources').optional().isArray().withMessage('Resources must be an array'),
    validateRequest,
  ],
  updateProject,
);

router.delete(
  '/:projectId',
  [param('projectId').isUUID().withMessage('projectId must be a valid UUID'), validateRequest],
  deleteProject,
);

export default router;
