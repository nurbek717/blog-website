const Visitor = require('../models/Visitor');
const crypto = require('crypto');

// User Agent'dan qurilma turini aniqlash
function getDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    userAgent = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent)) {
        return 'mobile';
    } else if (/ipad|tablet/i.test(userAgent)) {
        return 'tablet';
    } else if (/windows|macintosh|linux/i.test(userAgent)) {
        return 'desktop';
    }
    
    return 'unknown';
}

// User Agent'dan brauzer nomini aniqlash
function getBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/edg/i.test(userAgent)) return 'Edge';
    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
    if (/opera|opr/i.test(userAgent)) return 'Opera';
    if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
    
    return 'Other';
}

// User Agent'dan OS ni aniqlash
function getOS(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    
    return 'Other';
}

// Sahifa turini aniqlash
function getPageType(path) {
    if (path === '/' || path === '') return 'home';
    if (path.startsWith('/blog/')) return 'blog';
    if (path.startsWith('/category/')) return 'category';
    if (path.startsWith('/search')) return 'search';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    return 'other';
}

// Tashrifni qayd qiluvchi middleware
const trackVisitor = async (req, res, next) => {
    try {
        // Admin sahifalarini kuzatmaslik
        if (req.path.startsWith('/admin')) {
            return next();
        }
        
        // Static fayllarni kuzatmaslik
        if (req.path.startsWith('/uploads') || 
            req.path.startsWith('/css') || 
            req.path.startsWith('/js') ||
            req.path.includes('.')) {
            return next();
        }
        
        // Sessiya ID sini olish yoki yaratish
        if (!req.session.visitorId) {
            req.session.visitorId = crypto.randomUUID();
        }
        
        const userAgent = req.get('User-Agent') || '';
        const ipAddress = req.ip || 
                          req.headers['x-forwarded-for'] || 
                          req.connection.remoteAddress || 
                          'unknown';
        
        // Asinxron tarzda saqlash (javobni kutmaslik)
        setImmediate(async () => {
            try {
                const visitor = new Visitor({
                    sessionId: req.session.visitorId,
                    ipAddress: ipAddress.split(',')[0].trim(),
                    userAgent,
                    deviceType: getDeviceType(userAgent),
                    browser: getBrowser(userAgent),
                    os: getOS(userAgent),
                    page: req.path,
                    pageType: getPageType(req.path),
                    referer: req.get('Referer') || ''
                });
                
                await visitor.save();
            } catch (err) {
                console.error('Visitor tracking error:', err.message);
            }
        });
        
        next();
    } catch (error) {
        // Xatolik yuz bersa ham saytni davom ettirish
        console.error('Visitor middleware error:', error.message);
        next();
    }
};

// Blog ko'rishini kuzatish (blog ID bilan)
const trackBlogView = async (req, res, next) => {
    try {
        if (!req.session.visitorId) {
            req.session.visitorId = crypto.randomUUID();
        }
        
        // Blog ID ni keyinchalik qo'shish uchun
        req.trackBlogId = async (blogId) => {
            try {
                await Visitor.findOneAndUpdate(
                    { 
                        sessionId: req.session.visitorId,
                        page: req.path,
                        visitedAt: { $gte: new Date(Date.now() - 5000) }
                    },
                    { blog: blogId },
                    { sort: { visitedAt: -1 } }
                );
            } catch (err) {
                console.error('Blog tracking error:', err.message);
            }
        };
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = { trackVisitor, trackBlogView };

