// Admin autentifikatsiya middleware
const isAdmin = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    
    // AJAX so'rovlar uchun
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Avtorizatsiya talab qilinadi' 
        });
    }
    
    // Redirect to login
    req.session.returnTo = req.originalUrl;
    res.redirect('/admin/login');
};

// Allaqachon login qilgan adminni tekshirish
const isGuest = (req, res, next) => {
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

// Session ma'lumotlarini viewga o'tkazish
const setLocals = (req, res, next) => {
    res.locals.admin = req.session?.admin || null;
    res.locals.success = req.session?.success;
    res.locals.error = req.session?.error;
    
    // Flash xabarlarni tozalash
    delete req.session?.success;
    delete req.session?.error;
    
    next();
};

module.exports = { isAdmin, isGuest, setLocals };


