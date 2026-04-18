const express = require('express');
const router = express.Router();
const { createMilestone, getMilestones, updateMilestone } = require('../controllers/milestoneController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth);

router.post('/', auth.checkRole('FACULTY'), createMilestone);
router.get('/project/:projectId', getMilestones);
router.put('/:id', upload.single('submissionFile'), updateMilestone);

module.exports = router;
