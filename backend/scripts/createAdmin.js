require('dotenv').config();
const mongoose = require('mongoose');

// Adjust path if needed
const Admin = require('../models/Admin.model');

async function createAdmin() {
    try {
        await mongoose.connect(process.env);

        console.log('✅ MongoDB Connected');

        // Check if admin exists
        const existingAdmin = await Admin.findOne({
            email: 'alfred@myblog.com'
        });

        if (existingAdmin) {
            console.log('⚠️ Admin already exists');
            process.exit(0);
        }

        // Create admin
        const admin = new Admin({
            email: 'alfred@myblog.com',
            password: 'Alfred@125#'
        });

        await admin.save();

        console.log('✅ Admin created successfully');
        console.log('Email: alfred@myblog.com');
        console.log('Password: Alfred@125#');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
}

createAdmin();