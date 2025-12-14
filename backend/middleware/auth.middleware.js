const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.model');

const protect = async (req, res, next) => {
    let token;
console.log('JWT_SECRET loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');
console.log('JWT_SECRET value:', process.env.JWT_SECRET);
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get admin from token
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Not authorized' 
                });
            }

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token' 
        });
    }
};

module.exports = { protect };