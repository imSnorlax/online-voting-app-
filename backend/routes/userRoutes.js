const express = require('express');
const { registerUser, loginUser } = require('../controllers/userController');
const validateRegister = require('../middlewares/validateRegister');
const validateLogin = require('../middlewares/validateLogin');
const { registerLimiter, loginLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/authMiddleware');
const validateProfileUpdate = require('../middlewares/validateProfileUpdate');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerLimiter, validateRegister, registerUser);
router.post('/login', loginLimiter, validateLogin, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, validateProfileUpdate, updateUserProfile);

module.exports = router;
