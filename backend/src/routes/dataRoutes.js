import express from 'express';
import {
  getAllData,
  getDataById,
  getStats,
} from '../controllers/dataController.js';

const router = express.Router();

// GET /api/data - Get all data with filters
router.get('/', getAllData);

// GET /api/data/stats - Get statistics
router.get('/stats', getStats);

// GET /api/data/:id - Get single data by ID
router.get('/:id', getDataById);

export default router;

