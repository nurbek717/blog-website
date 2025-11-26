const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Comment = require('../models/Comment');

// Bosh sahifa
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        
        const [blogs, total, featuredBlogs, categories] = await Promise.all([
            Blog.find({ status: 'published' })
                .populate('category', 'name slug')
                .populate('author', 'name avatar')
                .populate('commentCount')
                .sort('-publishedAt')
                .skip(skip)
                .limit(limit),
            Blog.countDocuments({ status: 'published' }),
            Blog.find({ status: 'published', isFeatured: true })
                .populate('category', 'name slug')
                .populate('author', 'name')
                .sort('-publishedAt')
                .limit(3),
            Category.find({ isActive: true })
                .populate('blogCount')
                .sort('order')
        ]);
        
        res.render('public/home', {
            title: 'Bosh Sahifa - Blog',
            blogs,
            featuredBlogs,
            categories,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.render('public/home', { 
            title: 'Bosh Sahifa - Blog',
            blogs: [],
            featuredBlogs: [],
            categories: [],
            currentPage: 1,
            totalPages: 1
        });
    }
});

// Kategoriya bo'yicha bloglar
router.get('/category/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug, isActive: true });
        
        if (!category) {
            return res.status(404).render('public/404', { title: 'Topilmadi' });
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        
        const [blogs, total, categories] = await Promise.all([
            Blog.find({ category: category._id, status: 'published' })
                .populate('category', 'name slug')
                .populate('author', 'name avatar')
                .populate('commentCount')
                .sort('-publishedAt')
                .skip(skip)
                .limit(limit),
            Blog.countDocuments({ category: category._id, status: 'published' }),
            Category.find({ isActive: true }).sort('order')
        ]);
        
        res.render('public/category', {
            title: `${category.name} - Blog`,
            category,
            blogs,
            categories,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('public/error', { title: 'Xatolik' });
    }
});

// Blog sahifasi
router.get('/blog/:slug', async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
            .populate('category', 'name slug')
            .populate('author', 'name avatar');
        
        if (!blog) {
            return res.status(404).render('public/404', { title: 'Topilmadi' });
        }
        
        // Ko'rishlar sonini oshirish
        blog.views += 1;
        await blog.save();
        
        const [comments, relatedBlogs, categories] = await Promise.all([
            Comment.find({ blog: blog._id, status: 'approved', parent: null })
                .populate({
                    path: 'replies',
                    match: { status: 'approved' }
                })
                .sort('-createdAt'),
            Blog.find({ 
                category: blog.category._id, 
                status: 'published',
                _id: { $ne: blog._id }
            })
                .populate('category', 'name slug')
                .limit(3),
            Category.find({ isActive: true }).sort('order')
        ]);
        
        res.render('public/blog', {
            title: blog.title,
            blog,
            comments,
            relatedBlogs,
            categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('public/error', { title: 'Xatolik' });
    }
});

// Izoh qo'shish
router.post('/blog/:slug/comment', async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' });
        
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog topilmadi' });
        }
        
        const { name, email, content, parent } = req.body;
        
        const comment = new Comment({
            blog: blog._id,
            name,
            email,
            content,
            parent: parent || null,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        await comment.save();
        
        // AJAX request
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ 
                success: true, 
                message: 'Izohingiz moderatsiyadan o\'tkaziladi' 
            });
        }
        
        res.redirect(`/blog/${req.params.slug}#comments`);
    } catch (error) {
        console.error(error);
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, message: 'Xatolik yuz berdi' });
        }
        
        res.redirect(`/blog/${req.params.slug}`);
    }
});

// Qidiruv
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        
        let blogs = [];
        let total = 0;
        
        if (q && q.trim()) {
            const searchQuery = {
                status: 'published',
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { content: { $regex: q, $options: 'i' } },
                    { tags: { $regex: q, $options: 'i' } }
                ]
            };
            
            [blogs, total] = await Promise.all([
                Blog.find(searchQuery)
                    .populate('category', 'name slug')
                    .populate('author', 'name avatar')
                    .sort('-publishedAt')
                    .skip(skip)
                    .limit(limit),
                Blog.countDocuments(searchQuery)
            ]);
        }
        
        const categories = await Category.find({ isActive: true }).sort('order');
        
        res.render('public/search', {
            title: `Qidiruv: ${q || ''} - Blog`,
            query: q,
            blogs,
            categories,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.render('public/search', { 
            title: 'Qidiruv - Blog',
            query: '',
            blogs: [],
            categories: [],
            currentPage: 1,
            totalPages: 1
        });
    }
});

// Haqida sahifasi
router.get('/about', async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort('order');
    res.render('public/about', { 
        title: 'Biz Haqimizda - Blog',
        categories 
    });
});

// Aloqa sahifasi
router.get('/contact', async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort('order');
    res.render('public/contact', { 
        title: 'Aloqa - Blog',
        categories 
    });
});

module.exports = router;


