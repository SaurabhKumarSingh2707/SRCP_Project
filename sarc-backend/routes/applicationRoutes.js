const express = require('express');
const router = express.Router();
const { applyForProject, getStudentApplications, getFacultyApplications, updateApplicationStatus } = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(auth);

// Student routes
router.post('/apply', auth.checkRole('STUDENT'), upload.single('resumeFile'), applyForProject);
router.get('/student', auth.checkRole('STUDENT'), getStudentApplications);

// Faculty routes
router.get('/faculty', auth.checkRole('FACULTY'), getFacultyApplications);
router.put('/:id/status', auth.checkRole('FACULTY'), updateApplicationStatus);

module.exports = router;
