const express = require('express');
const router = express.Router();
const { getAllFaculty, getFacultyById } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all routes

router.get('/faculty', getAllFaculty);
router.get('/faculty/:id', getFacultyById);

module.exports = router;
