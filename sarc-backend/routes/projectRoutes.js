const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', projectController.getProjects);
router.get('/ideas', projectController.getProjectIdeas);
router.get('/:id', projectController.getProjectById);
router.post('/', auth, upload.fields([
    { name: 'proposalFile', maxCount: 1 },
    { name: 'documentationFile', maxCount: 1 },
    { name: 'demoFile', maxCount: 1 },
    { name: 'imageFiles', maxCount: 5 }
]), projectController.createProject);
router.post('/ideas', auth, upload.single('supportingFile'), projectController.createProjectIdea);

module.exports = router;
