require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./config/database');
const { setLocals } = require('./middleware/auth');

// Routes
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();

// Connect to MongoDB
connectDB();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'blog-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_db',
        ttl: 24 * 60 * 60 // 1 kun
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 kun
    }
}));

// Set locals for views
app.use(setLocals);

// Routes
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('public/404', { title: 'Topilmadi' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('public/error', { title: 'Xatolik' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Blog Website serveri ishga tushdi!                    ║
║                                                            ║
║   📍 Sayt: http://localhost:${PORT}                          ║
║   🔐 Admin: http://localhost:${PORT}/admin/login              ║
║                                                            ║
║   📧 Admin Email: admin@blog.com                           ║
║   🔑 Admin Parol: admin123                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
});


