//routes/blog.routes.js
const express = require('express');
const router = express.Router();
const { 
    getBlogs, 
    getBlogById, 
    createBlog, 
    updateBlog, 
    deleteBlog,
    getAdminBlogs,
    getAdminStats,          // ← ADD THIS
} = require('../controllers/blog.controller');
const { protect } = require('../middleware/auth.middleware');

// ======================
// Public routes
// ======================
router.get('/', getBlogs);

// ======================
// Protected routes (auth required)
// ======================
router.use(protect);

// ⚠️ Admin/specific routes MUST come before /:id
router.get('/admin/all', getAdminBlogs);
router.get('/admin/stats', getAdminStats);   // ← ADD THIS

// CRUD routes
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

// Dynamic route LAST — otherwise it swallows /admin/* on single-segment paths
router.get('/:id', getBlogById);

module.exports = router;