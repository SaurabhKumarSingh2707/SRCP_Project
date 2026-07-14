const express = require('express');
const router = express.Router();
const { createTeam, getTeams, getTeamById, joinTeam } = require('../controllers/teamController');
const auth = require('../middleware/auth');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

router.post('/', auth.checkRole('STUDENT'), createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/:id/join', auth.checkRole('STUDENT'), joinTeam);
router.post('/:id/upload-proxy', auth.checkRole('STUDENT'), upload.single('file'), require('../controllers/teamController').uploadFileProxy);
router.delete('/:id/upload-proxy', auth.checkRole('STUDENT'), require('../controllers/teamController').deleteFileProxy);
router.get('/:id/upload-proxy', require('../controllers/teamController').listFilesProxy);

module.exports = router;
