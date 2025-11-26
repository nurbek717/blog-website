# Blog Website

Node.js, Express.js va MongoDB asosida yaratilgan to'liq blog sayti.

## Xususiyatlar

### Admin Panel
- 🔐 Admin login tizimi
- 📝 Blog yaratish, tahrirlash, o'chirish
- 📁 Kategoriya boshqaruvi
- 💬 Izohlarni moderatsiya qilish
- 📊 Dashboard statistikasi

### Foydalanuvchi Frontend
- 🏠 Chiroyli bosh sahifa
- 📖 Blog o'qish sahifasi
- 🏷️ Kategoriya bo'yicha ko'rish
- 🔍 Qidiruv funksiyasi
- 💬 Izoh qoldirish
- 📱 Responsive dizayn

## O'rnatish

### Talablar
- Node.js v18 yoki undan yuqori
- MongoDB (local yoki Atlas)

### Qadamlar

1. **Loyihani klonlash:**
```bash
git clone <repository-url>
cd blog-website
```

2. **Paketlarni o'rnatish:**
```bash
npm install
```

3. **Environment sozlamalari:**
```bash
# env.example faylidan nusxa ko'chiring
cp env.example .env

# .env faylini tahrirlang
```

`.env` fayl tarkibi:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blog_db
SESSION_SECRET=your-super-secret-key
ADMIN_EMAIL=admin@blog.com
ADMIN_PASSWORD=admin123
```

4. **Boshlang'ich ma'lumotlarni yaratish:**
```bash
npm run seed
```

5. **Serverni ishga tushirish:**
```bash
# Development
npm run dev

# Production
npm start
```

6. **Brauzerda ochish:**
- Sayt: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Admin kirish ma'lumotlari

- **Email:** admin@blog.com
- **Parol:** admin123

## Loyiha strukturasi

```
blog-website/
├── config/
│   └── database.js         # MongoDB ulanish
├── middleware/
│   ├── auth.js             # Autentifikatsiya
│   └── upload.js           # Fayl yuklash
├── models/
│   ├── Admin.js            # Admin modeli
│   ├── Blog.js             # Blog modeli
│   ├── Category.js         # Kategoriya modeli
│   └── Comment.js          # Izoh modeli
├── public/
│   └── uploads/            # Yuklangan rasmlar
├── routes/
│   ├── admin.js            # Admin yo'llari
│   └── public.js           # Foydalanuvchi yo'llari
├── views/
│   ├── admin/              # Admin sahifalari
│   └── public/             # Foydalanuvchi sahifalari
├── .env                    # Muhit o'zgaruvchilari
├── package.json
├── seed.js                 # Boshlang'ich ma'lumotlar
└── server.js               # Asosiy server fayli
```

## API Endpoints

### Admin
- `GET /admin/login` - Login sahifasi
- `POST /admin/login` - Login qilish
- `GET /admin/logout` - Chiqish
- `GET /admin/dashboard` - Dashboard
- `GET/POST /admin/blogs` - Bloglar
- `GET/POST /admin/categories` - Kategoriyalar
- `GET/POST /admin/comments` - Izohlar

### Foydalanuvchi
- `GET /` - Bosh sahifa
- `GET /blog/:slug` - Blog sahifasi
- `GET /category/:slug` - Kategoriya sahifasi
- `GET /search` - Qidiruv
- `POST /blog/:slug/comment` - Izoh qo'shish
- `GET /about` - Biz haqimizda
- `GET /contact` - Aloqa

## Texnologiyalar

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Templating:** EJS
- **Auth:** express-session, bcryptjs
- **File Upload:** Multer
- **Styling:** Custom CSS

## Muallif

Blog Website - 2024

## Litsenziya

MIT


