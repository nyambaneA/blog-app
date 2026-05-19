const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// === KEY CHANGE: Detect Vercel environment ===
const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

if (isVercel) {
    console.log('🚀 Running on Vercel platform');
    process.env.NODE_ENV = 'production';
}

// Import routes
const authRoutes = require('./routes/auth.routes');
const blogRoutes = require('./routes/blog.routes');

const app = express();

console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`🔍 Vercel Detected: ${isVercel ? 'YES' : 'NO'}`);

const corsOptions = {
    origin: function (origin, callback) {
        // In production, allow your Vercel domain, localhost (for testing), and mobile network origins
        const allowedOrigins = [
            'https://blog-app-mocha-tau.vercel.app',
            'https://www.lecturerroom.online',
            // Your Vercel URL
            'http://localhost:3000',            // Local development
            // Add any other preview URLs Vercel generates
        ];
        
        // Allow requests with no origin (like mobile apps or server-to-server requests)
        // Also allow if the origin is in the list or if we're in development
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    maxAge: 86400 // Preflight result cache for 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicitly handle preflight for all routes

// ======================
// Database Connection
// ======================
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not set in environment variables');
            
            if (isProduction) {
                console.error('🚨 Cannot run production without database connection');
            } else {
                console.log('⚠️  Development mode: Continuing without database connection');
                return;
            }
        } else {
            const maskedURI = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
            console.log('🔗 Attempting MongoDB connection to:', maskedURI);
            
            await mongoose.connect(mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000,
            });
            
            console.log('✅ MongoDB connected successfully');
            
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

// Debug middleware
app.use((req, res, next) => {
    if (req.url === '/' || req.url === '/api/health' || req.url === '/api/debug/files') {
        console.log(`📥 ${req.method} ${req.url}`);
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
            health: '/api/health',
            debug: '/api/debug/files'
        }
    });
});

// ======================
// Debug Endpoint - Check File Locations
// ======================
app.get('/api/debug/files', (req, res) => {
    const checkPaths = [
        { path: path.join(__dirname, 'public'), name: 'backend/public' },
        { path: path.join(__dirname, '../frontend/build'), name: 'frontend/build' },
        { path: __dirname, name: 'backend directory' }
    ];
    
    const results = checkPaths.map(item => {
        const exists = fs.existsSync(item.path);
        let files = [];
        let hasIndexHtml = false;
        if (exists) {
            try {
                files = fs.readdirSync(item.path);
                hasIndexHtml = files.includes('index.html');
            } catch (err) {
                files = [`Error: ${err.message}`];
            }
        }
        return {
            name: item.name,
            exists,
            path: item.path,
            file_count: exists ? files.length : 0,
            has_index_html: hasIndexHtml,
            sample_files: exists ? files.slice(0, 5) : []
        };
    });
    
    res.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: isVercel,
        production: isProduction,
        file_check: results,
        server_root: __dirname,
        current_working_dir: process.cwd()
    });
});

// ======================
// Production Static File Serving (Dual Path Check)
// ======================
if (isProduction) {
    // Try multiple possible locations for frontend build
    let publicDir = null;
    let source = 'none';
    
    // Location 1: frontend/build (where React builds to)
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    // Location 2: backend/public (if files were copied)
    const backendPublicPath = path.join(__dirname, 'public');
    
    console.log(`📁 Checking for frontend files...`);
    console.log(`  1. frontend/build: ${frontendBuildPath} - exists: ${fs.existsSync(frontendBuildPath)}`);
    console.log(`  2. backend/public: ${backendPublicPath} - exists: ${fs.existsSync(backendPublicPath)}`);
    
    if (fs.existsSync(frontendBuildPath)) {
        publicDir = frontendBuildPath;
        source = 'frontend/build';
        console.log(`✅ Using frontend/build directory`);
    } else if (fs.existsSync(backendPublicPath)) {
        publicDir = backendPublicPath;
        source = 'backend/public';
        console.log(`✅ Using backend/public directory`);
    } else {
        console.warn('⚠️  No frontend build found in either location');
    }
    
    if (publicDir) {
        // List files for debugging
        try {
            const files = fs.readdirSync(publicDir);
            console.log(`📁 Files in ${source}: ${files.length}`);
            if (files.length > 0) {
                console.log(`📁 First 5 files: ${files.slice(0, 5).join(', ')}`);
                if (files.includes('index.html')) {
                    console.log('✅ Found index.html');
                } else {
                    console.warn('⚠️  index.html not found in files list');
                }
            }
        } catch (err) {
            console.error('❌ Error reading directory:', err.message);
        }
        
        // Serve static files
        app.use(express.static(publicDir, {
            maxAge: '1d',
            fallthrough: true,
            extensions: ['html', 'htm']
        }));
        
        console.log(`✅ Serving static files from: ${source}`);
    } else {
        console.log('ℹ️  No static files directory found - API only mode');
    }
}

// ======================
// Root Route Handling
// ======================
app.get('/', (req, res) => {
    if (isProduction) {
        // Try multiple locations for index.html
        const locations = [
            { path: path.join(__dirname, '../frontend/build/index.html'), name: 'frontend/build' },
            { path: path.join(__dirname, 'public/index.html'), name: 'backend/public' }
        ];
        
        console.log('🔍 Looking for frontend in production...');
        
        for (const loc of locations) {
            if (fs.existsSync(loc.path)) {
                console.log(`📄 Serving React frontend from: ${loc.name}`);
                return res.sendFile(loc.path);
            } else {
                console.log(`❌ Not found: ${loc.name}`);
            }
        }
        
        // No frontend found - show helpful error
        console.error('❌ No frontend build found in any location');
        return res.status(500).json({
            error: 'Frontend not deployed',
            message: 'React frontend build files not found.',
            instructions: '1. Check Vercel build logs\n2. Visit /api/debug/files to see available files\n3. Ensure frontend builds to frontend/build/',
            check_endpoint: '/api/debug/files',
            api_endpoints: {
                health: '/api/health',
                info: '/api/info'
            }
        });
    }
    
    // Development message
    res.json({
        message: 'Blog API Server - Development Mode',
        note: 'Frontend runs separately on port 3000',
        frontend: 'http://localhost:3000',
        api: 'http://localhost:5000/api',
        endpoints: {
            health: '/api/health',
            info: '/api/info',
            debug: '/api/debug/files'
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
        
        // Try to serve from frontend/build first, then backend/public
        const locations = [
            path.join(__dirname, '../frontend/build/index.html'),
            path.join(__dirname, 'public/index.html')
        ];
        
        for (const indexPath of locations) {
            if (fs.existsSync(indexPath)) {
                return res.sendFile(indexPath);
            }
        }
        
        // If no index.html found, continue to next middleware
        next();
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

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl,
        available_endpoints: ['/api/auth', '/api/blogs', '/api/health', '/api/info', '/api/debug/files']
    });
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Check for frontend files
    const frontendBuildExists = fs.existsSync(path.join(__dirname, '../frontend/build'));
    const backendPublicExists = fs.existsSync(path.join(__dirname, 'public'));
    const indexHtmlExists = fs.existsSync(path.join(__dirname, '../frontend/build/index.html')) || 
                           fs.existsSync(path.join(__dirname, 'public/index.html'));
    
    console.log(`
╔══════════════════════════════════════════╗
║         🚀 Blog Application Server       ║
╠══════════════════════════════════════════╣
║ Port:      ${PORT.toString().padEnd(30)}║
║ Mode:      ${(isProduction ? 'production' : 'development').padEnd(30)}║
║ Vercel:    ${isVercel ? 'YES'.padEnd(30) : 'NO'.padEnd(30)}║
║ Database:  ${dbStatus.padEnd(30)}║
║ Frontend:  ${indexHtmlExists ? 'Ready ✅'.padEnd(30) : 'Not found ⚠️'.padEnd(30)}║
╚══════════════════════════════════════════╝
    `);
    
    console.log('\n📡 Available endpoints:');
    console.log(`   • Website:    http://localhost:${PORT}/`);
    console.log(`   • API Debug:  http://localhost:${PORT}/api/debug/files`);
    console.log(`   • API Health: http://localhost:${PORT}/api/health`);
    console.log(`   • API Info:   http://localhost:${PORT}/api/info`);
    
    if (!isProduction) {
        console.log(`\n🔧 Development Frontend: http://localhost:3000`);
    }
    
    console.log('\n📁 File locations:');
    console.log(`   • frontend/build: ${frontendBuildExists ? 'Exists' : 'Missing'}`);
    console.log(`   • backend/public: ${backendPublicExists ? 'Exists' : 'Missing'}`);
    console.log(`   • index.html: ${indexHtmlExists ? 'Found ✅' : 'Not found ⚠️'}`);
    
    if (isProduction && !indexHtmlExists) {
        console.warn('\n⚠️  WARNING: Frontend files not found.');
        console.warn('   The build process must create frontend/build/ or backend/public/');
        console.warn('   Visit /api/debug/files after deployment to check.');
    }
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});