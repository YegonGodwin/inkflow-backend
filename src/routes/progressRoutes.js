import { Router } from 'express';
import { getOverview } from '../controllers/progressController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/overview', getOverview);

export default router;
