require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Blog = require('./models/Blog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_db';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB ulandi...');

        // Admin yaratish
        const existingAdmin = await Admin.findOne({ email: 'admin@blog.com' });
        let admin;
        
        if (!existingAdmin) {
            admin = await Admin.create({
                email: 'admin@blog.com',
                password: 'admin123',
                name: 'Admin',
                role: 'superadmin'
            });
            console.log('✅ Admin yaratildi');
        } else {
            admin = existingAdmin;
            console.log('ℹ️ Admin allaqachon mavjud');
        }

        // Kategoriyalar yaratish
        const categoriesData = [
            { name: 'Texnologiya', description: 'Eng so\'nggi texnologiya yangiliklari va sharhlari', order: 1 },
            { name: 'Dasturlash', description: 'Dasturlash tillari, frameworklar va best practices', order: 2 },
            { name: 'Dizayn', description: 'UI/UX dizayn, grafik dizayn va ilhom', order: 3 },
            { name: 'Biznes', description: 'Biznes strategiyalari va tadbirkorlik', order: 4 },
            { name: 'Hayot tarzi', description: 'Sog\'lom hayot tarzi va shaxsiy rivojlanish', order: 5 }
        ];

        const categories = [];
        for (const catData of categoriesData) {
            let category = await Category.findOne({ name: catData.name });
            if (!category) {
                category = await Category.create(catData);
                console.log(`✅ Kategoriya yaratildi: ${catData.name}`);
            }
            categories.push(category);
        }

        // Namuna bloglar yaratish
        const blogsData = [
            {
                title: 'Node.js 2024 yilda: Eng yaxshi amaliyotlar',
                content: `Node.js veb-dasturlashda eng mashhur platformalardan biriga aylandi. 2024 yilda Node.js bilan ishlashda qanday eng yaxshi amaliyotlarni qo'llash kerak?

Birinchidan, zamonaviy ECMAScript xususiyatlaridan foydalaning. ES2024 bilan kelgan yangiliklar kodingizni yanada tozaroq va samarali qiladi.

Ikkinchidan, xavfsizlikka alohida e'tibor bering. Helmet, rate limiting va CORS kabi middleware'larni to'g'ri sozlash muhim.

Uchinchidan, mikroservislar arxitekturasini o'rganing. Katta loyihalar uchun monolit arxitekturadan mikroservislar arxitekturasiga o'tish katta foyda keltiradi.

To'rtinchidan, testlash madaniyatini joriy qiling. Jest yoki Mocha yordamida unit testlar yozish kodingiz sifatini oshiradi.`,
                excerpt: 'Node.js 2024 yilda eng yaxshi amaliyotlar: zamonaviy ES xususiyatlari, xavfsizlik, mikroservislar va testlash.',
                category: categories[1]._id,
                author: admin._id,
                status: 'published',
                isFeatured: true,
                tags: ['nodejs', 'javascript', 'backend']
            },
            {
                title: 'React va Vue.js: 2024 yilda qaysi birini tanlash kerak?',
                content: `Frontend development dunyosida React va Vue.js eng mashhur frameworklar hisoblanadi. Qaysi birini tanlash yaxshiroq?

React - Meta (Facebook) tomonidan ishlab chiqilgan va juda katta jamiyatga ega. Ish joylari ko'p va katta kompaniyalar React'ni afzal ko'radi.

Vue.js - oddiyroq va o'rganish osonroq. Kichik va o'rta loyihalar uchun juda mos. Dokumentatsiyasi zo'r va bosqichma-bosqich o'rganish mumkin.

Tanlash sizning maqsadlaringizga bog'liq. Agar katta kompaniyalarda ishlashni xohlasangiz - React. Tezda natija olishni xohlasangiz - Vue.js.`,
                excerpt: 'React va Vue.js o\'rtasidagi farqlar va qaysi birini qachon tanlash kerakligi haqida batafsil qo\'llanma.',
                category: categories[1]._id,
                author: admin._id,
                status: 'published',
                isFeatured: true,
                tags: ['react', 'vuejs', 'frontend', 'javascript']
            },
            {
                title: 'UI/UX dizayn trendlari 2024',
                content: `2024 yilda UI/UX dizayn sohasida qanday trendlar kuzatilmoqda?

1. Minimalizm davom etmoqda. Ortiqcha elementlardan xoli, toza va sodda dizaynlar hamon mashhur.

2. Dark mode - ko'pchilik foydalanuvchilar tungi rejimni afzal ko'rishmoqda. Loyihangizda dark mode qo'llab-quvvatlashni unutmang.

3. Micro-animations - kichik animatsiyalar foydalanuvchi tajribasini yaxshilaydi va saytni jonlantiradi.

4. 3D elementlar - WebGL va Three.js yordamida 3D elementlarni qo'shish saytingizni ajratib turadi.

5. Accessibility - barcha foydalanuvchilar uchun qulay dizayn yaratish muhim. Kontrast, font o'lchamlari va klaviatura navigatsiyasiga e'tibor bering.`,
                excerpt: 'UI/UX dizayn sohasidagi 2024 yildagi eng dolzarb trendlar va ularni qo\'llash usullari.',
                category: categories[2]._id,
                author: admin._id,
                status: 'published',
                isFeatured: true,
                tags: ['uxui', 'dizayn', 'trendlar']
            },
            {
                title: 'Startap qanday boshlash kerak?',
                content: `Startap boshlash haqida o'ylayapsizmi? Bu maqolada eng muhim qadamlarni ko'rib chiqamiz.

1. G'oyani tekshiring - Bozorda haqiqiy muammo bormi? Sizning yechimingiz kerakmi?

2. MVP yarating - Minimal Viable Product yaratib, uni bozorda sinab ko'ring.

3. Foydalanuvchi fikrlarini to'plang - Birinchi foydalanuvchilaringiz eng qimmatli ma'lumot manbai.

4. Jamoa tuzish - Bir o'zingiz hammani qila olmaysiz. To'g'ri odamlarni toping.

5. Investitsiya - Kerak bo'lsa investorlar bilan ishlang, lekin ehtiyot bo'ling.

Startap - bu marafon, sprint emas. Sabr-toqat va izchillik muvaffaqiyat kaliti.`,
                excerpt: 'Startap qanday boshlash kerak? G\'oyadan to investitsiyagacha bo\'lgan yo\'l.',
                category: categories[3]._id,
                author: admin._id,
                status: 'published',
                tags: ['startap', 'biznes', 'tadbirkorlik']
            },
            {
                title: 'Dasturchi sifatida muvaffaqiyatga erishish sirlari',
                content: `Dasturchi sifatida muvaffaqiyatga erishish uchun nima qilish kerak?

1. Doimiy o'rganish - Texnologiya tez o'zgaradi. Yangiliklarga hamohang bo'ling.

2. Open source loyihalarda ishtirok eting - Bu tajribangizni oshiradi va tarmoqingizni kengaytiradi.

3. Portfolio yarating - Ishlaringizni ko'rsating. GitHub profili juda muhim.

4. Soft skills - Kommunikatsiya, jamoa bilan ishlash, muammolarni hal qilish kabi ko'nikmalar texnik bilimlar kabi muhim.

5. Balans saqlang - Ish va shaxsiy hayot o'rtasida balans saqlash burnout'dan saqlanishga yordam beradi.`,
                excerpt: 'Dasturchi sifatida karyerada muvaffaqiyatga erishish uchun amal qilish kerak bo\'lgan maslahatlar.',
                category: categories[0]._id,
                author: admin._id,
                status: 'published',
                tags: ['karyera', 'dasturlash', 'muvaffaqiyat']
            }
        ];

        for (const blogData of blogsData) {
            const existingBlog = await Blog.findOne({ title: blogData.title });
            if (!existingBlog) {
                await Blog.create(blogData);
                console.log(`✅ Blog yaratildi: ${blogData.title.substring(0, 40)}...`);
            }
        }

        console.log('\n🎉 Ma\'lumotlar muvaffaqiyatli yaratildi!');
        console.log('\n📧 Admin Email: admin@blog.com');
        console.log('🔑 Admin Parol: admin123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
        process.exit(1);
    }
};

seedData();


