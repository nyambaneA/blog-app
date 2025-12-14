const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { 
    registerAdmin, 
    loginAdmin, 
    getMe 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Validation rules
const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

// Routes
router.post('/register', registerAdmin);
router.post('/login', loginValidation, loginAdmin);
router.get('/me', protect, getMe);

module.exports = router;