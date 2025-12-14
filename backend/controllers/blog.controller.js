const Blog = require('../models/Blog.model');

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const blogs = await Blog.find({ isPublished: true })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'email')
            .select('-sections');

        const total = await Blog.countDocuments({ isPublished: true });

        res.json({
            success: true,
            count: blogs.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            blogs
        });
    } catch (error) {
        console.error('Get blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'email');

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Check if blog is published
        if (!blog.isPublished) {
            return res.status(403).json({
                success: false,
                message: 'This blog is not published'
            });
        }

        res.json({
            success: true,
            blog
        });
    } catch (error) {
        console.error('Get blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
const createBlog = async (req, res) => {
    try {
        const { title, introduction, sections, isPublished } = req.body;

        const blog = await Blog.create({
            title,
            introduction,
            sections,
            isPublished,
            author: req.admin._id
        });

        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            blog
        });
    } catch (error) {
        console.error('Create blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
const updateBlog = async (req, res) => {
    try {
        let blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Check if admin is the author
        if (blog.author.toString() !== req.admin._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this blog'
            });
        }

        blog = await Blog.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Blog updated successfully',
            blog
        });
    } catch (error) {
        console.error('Update blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Check if admin is the author
        if (blog.author.toString() !== req.admin._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this blog'
            });
        }

        await blog.deleteOne();

        res.json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get admin's blogs
// @route   GET /api/blogs/admin/all
// @access  Private
const getAdminBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.admin._id })
            .sort({ createdAt: -1 })
            .populate('author', 'email');

        res.json({
            success: true,
            count: blogs.length,
            blogs
        });
    } catch (error) {
        console.error('Get admin blogs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    getAdminBlogs
};