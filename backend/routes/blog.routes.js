const express = require('express');
const router = express.Router();
const { 
    getBlogs, 
    getBlogById, 
    createBlog, 
    updateBlog, 
    deleteBlog,
    getAdminBlogs 
} = require('../controllers/blog.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Protected routes
router.use(protect);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.get('/admin/all', getAdminBlogs);

module.exports = router;