const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import your config file
const dbConfig = require('./config/db.config');
const authRoutes = require('./routes/auth.routes');
const blogRoutes = require('./routes/blog.routes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development'}`);

// ======================
// CORS Configuration
// ======================
const corsOptions = {
    origin: isProduction 
        ? process.env.FRONTEND_URL || 'http://localhost:5000'
        : true, // Allow all in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ======================
// Database Connection (Using your config file)
// ======================
const connectDB = async () => {
    try {
        console.log('🔗 Database Config:', {
            url: dbConfig.url ? dbConfig.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not set',
            hasOptions: !!dbConfig.options
        });
        
        if (!dbConfig.url) {
            throw new Error('MongoDB URI not found in config/db.config.js');
        }
        
        await mongoose.connect(dbConfig.url, dbConfig.options || {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ MongoDB connected successfully');
        
        // Monitor connection events
        mongoose.connection.on('error', err => {
            console.error('❌ MongoDB connection error:', err.message);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });
        
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('💡 Troubleshooting:');
        console.log('   1. Check config/db.config.js file exists');
        console.log('   2. Check .env has MONGODB_URI');
        console.log('   3. Ensure MongoDB is running');
        
        if (process.env.NODE_ENV === 'production') {
            console.error('Cannot start production server without database');
            process.exit(1);
        } else {
            console.log('⚠️  Development mode: Continuing without database');
        }
    }
};

connectDB();

// ======================
// Basic Middleware
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ======================
// API Routes
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

// ======================
// Health & Info Routes
// ======================
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    let statusText;
    
    switch(dbStatus) {
        case 0: statusText = 'disconnected'; break;
        case 1: statusText = 'connected'; break;
        case 2: statusText = 'connecting'; break;
        case 3: statusText = 'disconnecting'; break;
        default: statusText = 'unknown';
    }
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: {
            status: statusText,
            config: dbConfig.url ? 'Loaded from config/db.config.js' : 'No config'
        },
        uptime: process.uptime()
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'Blog API',
        version: '1.0.0',
        config: {
            dbConfig: dbConfig.url ? 'Present' : 'Missing',
            env: process.env.NODE_ENV || 'development'
        },
        endpoints: {
            auth: '/api/auth',
            blogs: '/api/blogs',
            health: '/api/health'
        }
    });
});

// ======================
// Development Root Route
// ======================
app.get('/', (req, res) => {
    res.json({
        message: 'Blog API Server',
        status: 'running',
        environment: 'development',
        config: {
            database: dbConfig.url ? 'Configured' : 'Not configured',
            source: 'config/db.config.js'
        },
        api: 'http://localhost:5000/api',
        frontend: 'http://localhost:3000',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        instructions: 'Run React app separately on port 3000'
    });
});

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    
    if (err.name === 'MongoError') {
        return res.status(500).json({
            error: 'Database error',
            message: 'Please check MongoDB connection',
            config: dbConfig.url ? 'Config loaded' : 'Config missing'
        });
    }
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        config: 'Using db.config.js'
    });
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    console.log(`
╔══════════════════════════════════════════╗
║         🚀 Blog Application Server       ║
╠══════════════════════════════════════════╣
║ Port:      ${PORT.toString().padEnd(30)}║
║ Mode:      ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║ Database:  ${dbStatus.padEnd(30)}║
║ Config:    Using db.config.js            ║
║ Frontend:  Separate (port 3000)          ║
║ CORS:      Development (all origins)     ║
╚══════════════════════════════════════════╝
    `);
    
    console.log('\n📡 Available endpoints:');
    console.log(`   • API:         http://localhost:${PORT}/api`);
    console.log(`   • Health:      http://localhost:${PORT}/api/health`);
    console.log(`   • Info:        http://localhost:${PORT}/api/info`);
    console.log(`   • Auth:        http://localhost:${PORT}/api/auth`);
    console.log(`   • Blogs:       http://localhost:${PORT}/api/blogs`);
    console.log(`\n🔧 Frontend:     http://localhost:3000`);
    console.log(`\n⚙️  Config:       Loaded from config/db.config.js`);
    
    console.log('\n✅ Server is ready!');
});