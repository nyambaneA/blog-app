const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// === KEY CHANGE 1: Detect Vercel environment ===
const isVercel = process.env.VERCEL === '1';
// Force production mode on Vercel or if NODE_ENV is set
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

if (isVercel) {
    console.log('🚀 Running on Vercel platform');
    process.env.NODE_ENV = 'production'; // Explicitly set for consistency
}

// Import routes
const authRoutes = require('./routes/auth.routes');
const blogRoutes = require('./routes/blog.routes');

const app = express();

console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`🔍 Vercel Detected: ${isVercel ? 'YES' : 'NO'}`);

// ======================
// CORS Configuration
// ======================
const corsOptions = {
    origin: isProduction 
        ? process.env.FRONTEND_URL || 'https://your-vercel-domain.vercel.app' // Update this
        : true, // Allow all in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ======================
// Database Connection (FIXED for Vercel)
// ======================
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not set in environment variables');
            
            if (isProduction) {
                console.error('🚨 Cannot run production without database connection');
                // Don't exit immediately on Vercel, but log heavily
                console.error('🚨 Application will start but database operations will fail');
            } else {
                console.log('⚠️  Development mode: Continuing without database connection');
                return;
            }
        } else {
            // Log a masked version for security
            const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
            console.log('🔗 Attempting MongoDB connection to:', maskedURI);
            
            await mongoose.connect(mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000,
            });
            
            console.log('✅ MongoDB connected successfully');
            
            // Connection event listeners
            mongoose.connection.on('error', err => {
                console.error('❌ MongoDB connection error:', err.message);
            });
            
            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB disconnected');
            });
        }
        
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        
        if (isProduction) {
            console.error('⚠️  Production server starting without database connection');
            // On Vercel, we don't want to crash the server
            // Let it start and handle DB errors gracefully in routes
        }
    }
};

connectDB();

// ======================
// Basic Middleware
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProduction ? 'combined' : 'dev'));

// === KEY CHANGE 2: Debug middleware for Vercel ===
app.use((req, res, next) => {
    if (req.url === '/' || req.url === '/api/health') {
        console.log(`📥 ${req.method} ${req.url} - NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${process.env.VERCEL}`);
    }
    next();
});

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
        vercel: !!isVercel,
        database: {
            status: statusText,
            uriConfigured: !!process.env.MONGODB_URI
        },
        frontend: {
            serving: isProduction ? 'from /public' : 'separate (dev)',
            built: isProduction ? fs.existsSync(path.join(__dirname, 'public', 'index.html')) : 'development mode'
        },
        uptime: process.uptime()
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'Blog API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        vercel: isVercel,
        endpoints: {
            auth: '/api/auth',
            blogs: '/api/blogs',
            health: '/api/health'
        }
    });
});

// ======================
// === FIXED: Production Static File Serving (No filesystem writes) ===
// ======================
if (isProduction) {
    const publicDir = path.join(__dirname, 'public');
    
    console.log(`📁 Production: Checking public directory at ${publicDir}`);
    
    // === FIXED: Only check, don't create directories/files ===
    if (fs.existsSync(publicDir)) {
        try {
            const files = fs.readdirSync(publicDir);
            console.log(`📁 Files in public directory: ${files.length} files`);
            if (files.length > 0 && files.length < 10) {
                console.log(`📁 File list: ${files.join(', ')}`);
            } else if (files.length >= 10) {
                console.log(`📁 File list: ${files.slice(0, 5).join(', ')}... and ${files.length - 5} more`);
            }
        } catch (err) {
            console.error('❌ Error reading public directory:', err.message);
        }
        
        // Serve static files
        app.use(express.static(publicDir, {
            maxAge: '1d',
            fallthrough: true // Important: allows requests to continue to other routes
        }));
        
        console.log('✅ Production: Static files will be served from', publicDir);
    } else {
        console.warn('⚠️  WARNING: Public directory does not exist at', publicDir);
        console.warn('   Frontend build may have failed or files not copied.');
        console.warn('   Check that "npm run build" creates backend/public/ during build phase.');
    }
}

// ======================
// === FIXED: Root Route Handling ===
// ======================
app.get('/', (req, res) => {
    if (isProduction) {
        // In production, try to serve the React app
        const publicDir = path.join(__dirname, 'public');
        const indexPath = path.join(publicDir, 'index.html');
        
        if (fs.existsSync(indexPath)) {
            console.log('📄 Serving React frontend from', indexPath);
            return res.sendFile(indexPath);
        } else {
            // Frontend not built - show helpful error instead of development message
            console.error('❌ index.html not found. Frontend build may have failed.');
            return res.status(500).json({
                error: 'Frontend not built',
                message: 'The React frontend was not built properly.',
                instructions: 'Check Vercel build logs for frontend build errors.',
                api: {
                    health: '/api/health',
                    info: '/api/info',
                    note: 'API endpoints are working (database connected successfully)'
                },
                build: {
                    expected: 'backend/public/index.html',
                    actual: indexPath,
                    exists: fs.existsSync(indexPath)
                }
            });
        }
    }
    
    // Development message
    res.json({
        message: 'Blog API Server',
        status: 'running',
        environment: isProduction ? 'production' : 'development',
        vercel: isVercel,
        config: {
            database: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
            source: 'config/db.config.js',
            connected: mongoose.connection.readyState === 1
        },
        frontend: isProduction ? 'Should be served from /public' : 'http://localhost:3000',
        instructions: isProduction 
            ? 'Frontend should be served automatically. If seeing this, check build process.'
            : 'Run React app separately on port 3000',
        endpoints: {
            api: '/api',
            health: '/api/health',
            info: '/api/info'
        }
    });
});

// ======================
// Handle SPA routing for all other non-API routes in production
// ======================
if (isProduction) {
    app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return next();
        }
        
        // Skip root route (already handled above)
        if (req.path === '/') {
            return next();
        }
        
        const publicDir = path.join(__dirname, 'public');
        const indexPath = path.join(publicDir, 'index.html');
        
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            // If frontend not built, return 404 or API error
            next();
        }
    });
}

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.message);
    
    res.status(err.status || 500).json({
        error: isProduction ? 'Internal server error' : err.message,
        ...(isProduction ? {} : { stack: err.stack })
    });
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const publicDirExists = fs.existsSync(path.join(__dirname, 'public'));
    const indexPathExists = fs.existsSync(path.join(__dirname, 'public', 'index.html'));
    
    console.log(`
╔══════════════════════════════════════════╗
║         🚀 Blog Application Server       ║
╠══════════════════════════════════════════╣
║ Port:      ${PORT.toString().padEnd(30)}║
║ Mode:      ${(isProduction ? 'production' : 'development').padEnd(30)}║
║ Vercel:    ${isVercel ? 'YES'.padEnd(30) : 'NO'.padEnd(30)}║
║ Database:  ${dbStatus.padEnd(30)}║
║ Frontend:  ${isProduction ? (indexPathExists ? 'Ready from /public' : 'Not built').padEnd(30) : 'Separate (dev)'.padEnd(30)}║
╚══════════════════════════════════════════╝
    `);
    
    console.log('\n📡 Available endpoints:');
    console.log(`   • Website:    http://localhost:${PORT}/`);
    console.log(`   • API:        http://localhost:${PORT}/api`);
    console.log(`   • Health:     http://localhost:${PORT}/api/health`);
    console.log(`   • Info:       http://localhost:${PORT}/api/info`);
    
    if (!isProduction) {
        console.log(`\n🔧 Development Frontend: http://localhost:3000`);
    }
    
    console.log('\n✅ Server initialization complete');
    console.log(`📁 Public dir exists: ${publicDirExists}`);
    console.log(`📁 index.html exists: ${indexPathExists}`);
    
    if (isProduction && !indexPathExists) {
        console.warn('\n⚠️  WARNING: Frontend not built. The build process must create backend/public/index.html');
    }
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error.message);
  console.error('Stack:', error.stack);
  // Don't exit on Vercel - let the function handle it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});