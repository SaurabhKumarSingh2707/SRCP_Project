const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'resumeFile', maxCount: 1 }
]), authController.updateProfile);

module.exports = router;
