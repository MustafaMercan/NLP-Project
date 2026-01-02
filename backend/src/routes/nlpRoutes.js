import express from 'express';
import {
  trainModel,
  classifyData,
  classifyBatchData,
  getCategories,
  getNlpStats,
  checkDatabaseStatus,
} from '../controllers/nlpController.js';

const router = express.Router();

// GET /api/nlp/debug/db - Check database status (debug)
router.get('/debug/db', checkDatabaseStatus);

// POST /api/nlp/train - Train models
router.post('/train', trainModel);

// POST /api/nlp/classify - Classify single data
router.post('/classify', classifyData);

// POST /api/nlp/classify/batch - Batch classification
router.post('/classify/batch', classifyBatchData);

// GET /api/nlp/categories - Get categories
router.get('/categories', getCategories);

// GET /api/nlp/stats - Get NLP statistics
router.get('/stats', getNlpStats);

export default router;

