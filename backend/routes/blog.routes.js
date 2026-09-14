//routes/blog.routes.js
const express = require('express');
const router = express.Router();
const { 
    getBlogs, 
    getBlogById, 
    createBlog, 
    updateBlog, 
    deleteBlog,
    getAdminStats, 
    getAdminBlogs 
} = require('../controllers/blog.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Protected — protect applied per route
router.get('/admin/all', protect, getAdminBlogs);
router.get('/admin/stats', protect, getAdminStats);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

module.exports = router;