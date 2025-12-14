const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    heading: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    examples: [{
        type: String
    }]
});

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    introduction: {
        type: String,
        required: true,
        maxlength: 2000
    },
    sections: [sectionSchema],
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Set publishedAt when blog is published
blogSchema.pre('save', function(next) {
    if (this.isPublished && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Blog', blogSchema);