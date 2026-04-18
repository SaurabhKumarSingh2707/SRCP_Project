const express = require('express');
const router = express.Router();
const { createTeam, getTeams, getTeamById, joinTeam } = require('../controllers/teamController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', auth.checkRole('STUDENT'), createTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/:id/join', auth.checkRole('STUDENT'), joinTeam);

module.exports = router;
