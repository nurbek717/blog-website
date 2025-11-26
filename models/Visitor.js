const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    // Sessiya identifikatori
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    // IP manzil
    ipAddress: {
        type: String,
        default: 'unknown'
    },
    // User Agent (brauzer ma'lumoti)
    userAgent: {
        type: String,
        default: ''
    },
    // Qurilma turi
    deviceType: {
        type: String,
        enum: ['desktop', 'tablet', 'mobile', 'unknown'],
        default: 'unknown'
    },
    // Brauzer nomi
    browser: {
        type: String,
        default: 'unknown'
    },
    // Operatsion tizim
    os: {
        type: String,
        default: 'unknown'
    },
    // Ko'rilgan sahifa
    page: {
        type: String,
        required: true
    },
    // Sahifa turi
    pageType: {
        type: String,
        enum: ['home', 'blog', 'category', 'search', 'about', 'contact', 'other'],
        default: 'other'
    },
    // Agar blog sahifasi bo'lsa
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        default: null
    },
    // Referer (qayerdan kelgan)
    referer: {
        type: String,
        default: ''
    },
    // Kirish vaqti
    visitedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Kunning soati (0-23)
    hour: {
        type: Number,
        min: 0,
        max: 23
    },
    // Hafta kuni (0-6, 0=Yakshanba)
    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
    },
    // Sessiya davomiyligi (sekundlarda)
    duration: {
        type: Number,
        default: 0
    },
    // Mamlakat (agar kerak bo'lsa)
    country: {
        type: String,
        default: 'unknown'
    }
}, {
    timestamps: true
});

// Indekslar
visitorSchema.index({ visitedAt: -1 });
visitorSchema.index({ sessionId: 1, visitedAt: -1 });
visitorSchema.index({ pageType: 1, visitedAt: -1 });
visitorSchema.index({ hour: 1 });
visitorSchema.index({ dayOfWeek: 1 });

// Pre-save hook - soat va hafta kunini avtomatik belgilash
visitorSchema.pre('save', function(next) {
    if (this.isNew) {
        const date = this.visitedAt || new Date();
        this.hour = date.getHours();
        this.dayOfWeek = date.getDay();
    }
    next();
});

// Statik metodlar - statistikalar uchun
visitorSchema.statics.getTodayCount = async function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.countDocuments({ visitedAt: { $gte: today } });
};

visitorSchema.statics.getWeeklyCount = async function() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.countDocuments({ visitedAt: { $gte: weekAgo } });
};

visitorSchema.statics.getMonthlyCount = async function() {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return this.countDocuments({ visitedAt: { $gte: monthAgo } });
};

visitorSchema.statics.getUniqueVisitorsToday = async function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await this.distinct('sessionId', { visitedAt: { $gte: today } });
    return result.length;
};

visitorSchema.statics.getUniqueVisitorsWeekly = async function() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const result = await this.distinct('sessionId', { visitedAt: { $gte: weekAgo } });
    return result.length;
};

visitorSchema.statics.getUniqueVisitorsMonthly = async function() {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const result = await this.distinct('sessionId', { visitedAt: { $gte: monthAgo } });
    return result.length;
};

// Soatlik statistika
visitorSchema.statics.getHourlyStats = async function(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        { $match: { visitedAt: { $gte: startDate } } },
        { $group: { _id: '$hour', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
};

// Kunlik statistika (so'nggi N kun)
visitorSchema.statics.getDailyStats = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    return this.aggregate([
        { $match: { visitedAt: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    year: { $year: '$visitedAt' },
                    month: { $month: '$visitedAt' },
                    day: { $dayOfMonth: '$visitedAt' }
                },
                count: { $sum: 1 },
                uniqueVisitors: { $addToSet: '$sessionId' }
            }
        },
        {
            $project: {
                _id: 1,
                count: 1,
                uniqueVisitors: { $size: '$uniqueVisitors' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
};

// Hafta kunlari bo'yicha statistika
visitorSchema.statics.getWeekdayStats = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        { $match: { visitedAt: { $gte: startDate } } },
        { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
};

// Eng ko'p ko'rilgan sahifalar
visitorSchema.statics.getTopPages = async function(limit = 10, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        { $match: { visitedAt: { $gte: startDate } } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]);
};

// Qurilma statistikasi
visitorSchema.statics.getDeviceStats = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        { $match: { visitedAt: { $gte: startDate } } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};

// Brauzer statistikasi
visitorSchema.statics.getBrowserStats = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.aggregate([
        { $match: { visitedAt: { $gte: startDate } } },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
};

// Real-time tashrif (so'nggi 5 daqiqa)
visitorSchema.statics.getRealtimeVisitors = async function() {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const result = await this.distinct('sessionId', { visitedAt: { $gte: fiveMinutesAgo } });
    return result.length;
};

module.exports = mongoose.model('Visitor', visitorSchema);

