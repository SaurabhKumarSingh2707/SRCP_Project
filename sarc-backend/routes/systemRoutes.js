const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const authMiddleware = require('../middleware/auth');

router.get('/config', authMiddleware, systemController.getSystemConfig);
router.put('/config', authMiddleware, authMiddleware.checkRole('ADMIN'), systemController.updateSystemConfig);
router.put('/review-schedule/:reviewName', authMiddleware, authMiddleware.checkRole('ADMIN'), systemController.updateReviewSchedule);

module.exports = router;
