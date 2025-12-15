// Vercel-specific entry point
console.log('🚀 Starting Vercel serverless function...');

// Force production mode for Vercel
process.env.NODE_ENV = 'production';
process.env.VERCEL = '1';

// Load environment
require('dotenv').config();

console.log('✅ Environment loaded for Vercel');
console.log('📦 Node version:', process.version);

// Import main app
const app = require('./server');

module.exports = app;