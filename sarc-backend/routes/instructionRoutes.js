const express = require('express');
const router = express.Router();
const { createInstruction, getTeamInstructions, markInstructionAsRead } = require('../controllers/instructionController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get instructions for a team
router.get('/:teamId', getTeamInstructions);

// Create an instruction (Guide only)
router.post('/:teamId', authMiddleware.checkRole('FACULTY'), createInstruction);

// Mark instruction as read (Team Leader only)
router.put('/:instructionId/read', authMiddleware.checkRole('STUDENT'), markInstructionAsRead);

module.exports = router;
