// Vercel-specific server entry point
console.log('🚀 Starting Vercel serverless function...');

// Load environment variables FIRST
require('dotenv').config();

// Force production mode for Vercel
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

console.log('✅ Environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
  NODE_VERSION: process.version
});

// Now import your main server
const app = require('./server');

// Export as Vercel serverless function
module.exports = app;