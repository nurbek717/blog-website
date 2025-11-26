const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Ism kiritilishi shart'],
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: [true, 'Email kiritilishi shart'],
        lowercase: true,
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Izoh matni kiritilishi shart'],
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: javob izohlar
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parent'
});

// Index
commentSchema.index({ blog: 1, status: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);


