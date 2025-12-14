const Admin = require('../models/Admin.model');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');

// @desc    Register admin (initial setup)
// @route   POST /api/auth/register
// @access  Public
const registerAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if admin already exists
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists'
            });
        }

        // Create admin
        const admin = await Admin.create({
            email,
            password
        });

        if (admin) {
            res.status(201).json({
                success: true,
                message: 'Admin registered successfully',
                token: generateToken(admin._id)
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Check for admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await admin.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(admin._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get current admin
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('-password');
        res.json({
            success: true,
            admin
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getMe
};