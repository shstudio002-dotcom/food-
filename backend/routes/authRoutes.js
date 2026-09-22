const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile);

module.exports = router;