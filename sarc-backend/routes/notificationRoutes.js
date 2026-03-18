const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;
