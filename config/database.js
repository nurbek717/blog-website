const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            console.error('MONGODB_URI topilmadi!');
            process.exit(1);
        }
        
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        console.log(`MongoDB ulandi: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB xatolik: ${error.message}`);
        // Qayta ulanishga harakat qilish
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;


