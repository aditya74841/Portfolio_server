import express from 'express';
import { createPrompt, getAnalytics, getDetailedAnalytics, getAnalyticsSummary  } from '../controller/prompt.controller.js';
// import { createPrompt, getAnalytics, getDetailedAnalytics, getAnalyticsSummary } from '../controllers/prompt.controller.js';

const router = express.Router();

// Existing route
// router.post('/create', createPrompt);

// Analytics routes
router.post('/analytics', getAnalytics);
router.post('/analytics/detailed', getDetailedAnalytics);
router.get('/analytics/summary', getAnalyticsSummary);

export default router;
