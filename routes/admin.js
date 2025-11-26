const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Comment = require('../models/Comment');
const { isAdmin, isGuest } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ==================== AUTH ====================

// Login sahifasi
router.get('/login', isGuest, (req, res) => {
    res.render('admin/login', { 
        title: 'Admin Kirish',
        error: req.session.error 
    });
    delete req.session.error;
});

// Login
router.post('/login', isGuest, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const admin = await Admin.findOne({ email, isActive: true });
        
        if (!admin || !(await admin.matchPassword(password))) {
            req.session.error = 'Email yoki parol noto\'g\'ri';
            return res.redirect('/admin/login');
        }
        
        // Session saqlash
        req.session.admin = {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            avatar: admin.avatar
        };
        
        // Last login yangilash
        admin.lastLogin = new Date();
        await admin.save();
        
        const returnTo = req.session.returnTo || '/admin/dashboard';
        delete req.session.returnTo;
        
        res.redirect(returnTo);
    } catch (error) {
        console.error(error);
        req.session.error = 'Xatolik yuz berdi';
        res.redirect('/admin/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/admin/login');
    });
});

// ==================== DASHBOARD ====================

router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const [blogCount, categoryCount, commentCount, pendingComments, recentBlogs] = await Promise.all([
            Blog.countDocuments(),
            Category.countDocuments(),
            Comment.countDocuments({ status: 'approved' }),
            Comment.countDocuments({ status: 'pending' }),
            Blog.find()
                .populate('category', 'name')
                .populate('author', 'name')
                .sort('-createdAt')
                .limit(5)
        ]);
        
        res.render('admin/dashboard', {
            title: 'Dashboard',
            stats: { blogCount, categoryCount, commentCount, pendingComments },
            recentBlogs
        });
    } catch (error) {
        console.error(error);
        res.render('admin/dashboard', { 
            title: 'Dashboard',
            stats: { blogCount: 0, categoryCount: 0, commentCount: 0, pendingComments: 0 },
            recentBlogs: []
        });
    }
});

// ==================== BLOGS ====================

// Bloglar ro'yxati
router.get('/blogs', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.category) query.category = req.query.category;
        
        const [blogs, total, categories] = await Promise.all([
            Blog.find(query)
                .populate('category', 'name')
                .populate('author', 'name')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit),
            Blog.countDocuments(query),
            Category.find({ isActive: true })
        ]);
        
        res.render('admin/blogs/index', {
            title: 'Bloglar',
            blogs,
            categories,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            query: req.query
        });
    } catch (error) {
        console.error(error);
        req.session.error = 'Xatolik yuz berdi';
        res.redirect('/admin/dashboard');
    }
});

// Yangi blog sahifasi
router.get('/blogs/create', isAdmin, async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.render('admin/blogs/form', {
            title: 'Yangi Blog',
            blog: null,
            categories
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/blogs');
    }
});

// Blog yaratish
router.post('/blogs', isAdmin, upload.single('featuredImage'), async (req, res) => {
    try {
        const { title, content, excerpt, category, tags, status, isFeatured, metaTitle, metaDescription } = req.body;
        
        const blog = new Blog({
            title,
            content,
            excerpt,
            category,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            status,
            isFeatured: isFeatured === 'on',
            metaTitle,
            metaDescription,
            author: req.session.admin.id,
            featuredImage: req.file ? '/uploads/' + req.file.filename : '/uploads/default-blog.jpg'
        });
        
        await blog.save();
        
        req.session.success = 'Blog muvaffaqiyatli yaratildi';
        res.redirect('/admin/blogs');
    } catch (error) {
        console.error(error);
        req.session.error = 'Blog yaratishda xatolik: ' + error.message;
        res.redirect('/admin/blogs/create');
    }
});

// Blog tahrirlash sahifasi
router.get('/blogs/:id/edit', isAdmin, async (req, res) => {
    try {
        const [blog, categories] = await Promise.all([
            Blog.findById(req.params.id),
            Category.find({ isActive: true })
        ]);
        
        if (!blog) {
            req.session.error = 'Blog topilmadi';
            return res.redirect('/admin/blogs');
        }
        
        res.render('admin/blogs/form', {
            title: 'Blogni Tahrirlash',
            blog,
            categories
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/blogs');
    }
});

// Blog yangilash
router.post('/blogs/:id', isAdmin, upload.single('featuredImage'), async (req, res) => {
    try {
        const { title, content, excerpt, category, tags, status, isFeatured, metaTitle, metaDescription } = req.body;
        
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            req.session.error = 'Blog topilmadi';
            return res.redirect('/admin/blogs');
        }
        
        blog.title = title;
        blog.content = content;
        blog.excerpt = excerpt;
        blog.category = category;
        blog.tags = tags ? tags.split(',').map(t => t.trim()) : [];
        blog.status = status;
        blog.isFeatured = isFeatured === 'on';
        blog.metaTitle = metaTitle;
        blog.metaDescription = metaDescription;
        
        if (req.file) {
            blog.featuredImage = '/uploads/' + req.file.filename;
        }
        
        await blog.save();
        
        req.session.success = 'Blog muvaffaqiyatli yangilandi';
        res.redirect('/admin/blogs');
    } catch (error) {
        console.error(error);
        req.session.error = 'Blog yangilashda xatolik: ' + error.message;
        res.redirect(`/admin/blogs/${req.params.id}/edit`);
    }
});

// Blog o'chirish
router.post('/blogs/:id/delete', isAdmin, async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ blog: req.params.id });
        
        req.session.success = 'Blog muvaffaqiyatli o\'chirildi';
        res.redirect('/admin/blogs');
    } catch (error) {
        console.error(error);
        req.session.error = 'Blog o\'chirishda xatolik';
        res.redirect('/admin/blogs');
    }
});

// ==================== CATEGORIES ====================

// Kategoriyalar ro'yxati
router.get('/categories', isAdmin, async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('blogCount')
            .sort('order');
        
        res.render('admin/categories/index', {
            title: 'Kategoriyalar',
            categories
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/dashboard');
    }
});

// Yangi kategoriya sahifasi
router.get('/categories/create', isAdmin, (req, res) => {
    res.render('admin/categories/form', {
        title: 'Yangi Kategoriya',
        category: null
    });
});

// Kategoriya yaratish
router.post('/categories', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, order, isActive } = req.body;
        
        const category = new Category({
            name,
            description,
            order: parseInt(order) || 0,
            isActive: isActive === 'on',
            image: req.file ? '/uploads/' + req.file.filename : null
        });
        
        await category.save();
        
        req.session.success = 'Kategoriya muvaffaqiyatli yaratildi';
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.session.error = 'Kategoriya yaratishda xatolik: ' + error.message;
        res.redirect('/admin/categories/create');
    }
});

// Kategoriya tahrirlash sahifasi
router.get('/categories/:id/edit', isAdmin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            req.session.error = 'Kategoriya topilmadi';
            return res.redirect('/admin/categories');
        }
        
        res.render('admin/categories/form', {
            title: 'Kategoriyani Tahrirlash',
            category
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/categories');
    }
});

// Kategoriya yangilash
router.post('/categories/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, order, isActive } = req.body;
        
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            req.session.error = 'Kategoriya topilmadi';
            return res.redirect('/admin/categories');
        }
        
        category.name = name;
        category.description = description;
        category.order = parseInt(order) || 0;
        category.isActive = isActive === 'on';
        
        if (req.file) {
            category.image = '/uploads/' + req.file.filename;
        }
        
        await category.save();
        
        req.session.success = 'Kategoriya muvaffaqiyatli yangilandi';
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.session.error = 'Kategoriya yangilashda xatolik: ' + error.message;
        res.redirect(`/admin/categories/${req.params.id}/edit`);
    }
});

// Kategoriya o'chirish
router.post('/categories/:id/delete', isAdmin, async (req, res) => {
    try {
        const blogCount = await Blog.countDocuments({ category: req.params.id });
        
        if (blogCount > 0) {
            req.session.error = 'Bu kategoriyada bloglar mavjud. Avval ularni o\'chiring';
            return res.redirect('/admin/categories');
        }
        
        await Category.findByIdAndDelete(req.params.id);
        
        req.session.success = 'Kategoriya muvaffaqiyatli o\'chirildi';
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.session.error = 'Kategoriya o\'chirishda xatolik';
        res.redirect('/admin/categories');
    }
});

// ==================== COMMENTS ====================

// Izohlar ro'yxati
router.get('/comments', isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        const query = {};
        if (req.query.status) query.status = req.query.status;
        
        const [comments, total] = await Promise.all([
            Comment.find(query)
                .populate('blog', 'title slug')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit),
            Comment.countDocuments(query)
        ]);
        
        res.render('admin/comments/index', {
            title: 'Izohlar',
            comments,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            query: req.query
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/dashboard');
    }
});

// Izoh holatini o'zgartirish
router.post('/comments/:id/status', isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        
        await Comment.findByIdAndUpdate(req.params.id, { status });
        
        req.session.success = 'Izoh holati yangilandi';
        res.redirect('/admin/comments');
    } catch (error) {
        console.error(error);
        req.session.error = 'Xatolik yuz berdi';
        res.redirect('/admin/comments');
    }
});

// Izoh o'chirish
router.post('/comments/:id/delete', isAdmin, async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        
        req.session.success = 'Izoh o\'chirildi';
        res.redirect('/admin/comments');
    } catch (error) {
        console.error(error);
        req.session.error = 'Izoh o\'chirishda xatolik';
        res.redirect('/admin/comments');
    }
});

module.exports = router;


