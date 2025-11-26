const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Sarlavha kiritilishi shart'],
        trim: true,
        maxlength: 200
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    content: {
        type: String,
        required: [true, 'Kontent kiritilishi shart']
    },
    excerpt: {
        type: String,
        maxlength: 500
    },
    featuredImage: {
        type: String,
        default: '/uploads/default-blog.svg'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Kategoriya tanlanishi shart']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    views: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    },
    metaTitle: {
        type: String,
        maxlength: 70
    },
    metaDescription: {
        type: String,
        maxlength: 160
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Slug yaratish
blogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim() + '-' + Date.now().toString(36);
    }
    
    // Excerpt yaratish
    if (this.isModified('content') && !this.excerpt) {
        this.excerpt = this.content
            .replace(/<[^>]*>/g, '')
            .substring(0, 200) + '...';
    }
    
    // Nashr qilish vaqtini belgilash
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    
    next();
});

// Virtual: izohlar
blogSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'blog'
});

// Virtual: izohlar soni
blogSchema.virtual('commentCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'blog',
    count: true,
    match: { status: 'approved' }
});

// Index
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);


