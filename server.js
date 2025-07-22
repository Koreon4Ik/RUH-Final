// server.js

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // Для зберігання сесій в MongoDB
const crypto = require('crypto'); // Для генерації SESSION_SECRET, якщо потрібно

const app = express();
const PORT = process.env.PORT || 3000;

// --- Налаштування підключення до MongoDB ---
// Використовуємо змінну середовища MONGODB_URI для рядка підключення
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Вийти з процесу, якщо не вдалося підключитися
    });

// --- Схеми та моделі Mongoose ---

// Схема для новин
const newsSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    title: String,
    date: String,
    shortDescription: String,
    fullDescription: String,
    image: String
});
const News = mongoose.model('News', newsSchema);

// Схема для категорій (можна розширити, якщо потрібні інші поля)
const categorySchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    name: String
});
const Category = mongoose.model('Category', categorySchema);

// Схема для закладів
const establishmentSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true },
    name: String,
    type: String, // Кафе, Музей, Парк і т.д.
    address: String,
    phone: String,
    workingHours: String,
    description: String,
    image: String,
    coordinates: {
        latitude: Number,
        longitude: Number
    }
});
const Establishment = mongoose.model('Establishment', establishmentSchema);

// Схема для контактів (один запис)
const contactSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // Для унікальності, але завжди буде "contacts"
    address: String,
    phone: String,
    email: String,
    facebook: String,
    telegram: String,
    instagram: String
});
const Contact = mongoose.model('Contact', contactSchema);


// --- Налаштування сесій ---
// Секрет сесії має бути довгим і випадковим. Зберігайте його в змінних середовища.
// Якщо SESSION_SECRET не встановлено, генеруємо його (тільки для розробки, не для продакшну)
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET не встановлено в змінних середовища. Використовується випадково згенерований. Будь ласка, встановіть його для продакшну!');
}

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions', // Назва колекції для зберігання сесій
        ttl: 14 * 24 * 60 * 60 // Час життя сесії в секундах (14 днів)
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 днів
        secure: process.env.NODE_ENV === 'production', // true у продакшні (для HTTPS)
        httpOnly: true // Запобігає доступ до кукі через JavaScript на стороні клієнта
    }
}));


// Middleware для обробки JSON-даних у запитах
app.use(bodyParser.json());

// Middleware для обслуговування статичних файлів з папки 'public'
app.use(express.static(path.join(__dirname, 'public')));


// --- Middleware для перевірки автентифікації адміна ---
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}


// --- API-точки для роботи з даними (MongoDB) ---

// Отримати всі дані для адмін-панелі
app.get('/api/data', async (req, res) => {
    try {
        const news = await News.find({});
        const categories = await Category.find({});
        const establishments = await Establishment.find({});
        const contacts = await Contact.findOne({}); // Очікуємо лише один запис контактів

        res.json({
            news: news,
            categories: categories,
            establishments: establishments,
            contacts: contacts || {}, // Повертаємо порожній об'єкт, якщо контактів немає
            admin: {
                username: process.env.ADMIN_USERNAME,
                password: process.env.ADMIN_PASSWORD // НЕ НАДСИЛАТИ У РЕАЛЬНОМУ ПРОЕКТІ! ТІЛЬКИ ДЛЯ СПРОЩЕНОЇ АДМІН-ПАНЕЛІ
            }
        });
    } catch (error) {
        console.error('Помилка при отриманні всіх даних:', error);
        res.status(500).json({ message: 'Помилка сервера при отриманні даних.' });
    }
});


// --- CRUD для новин ---
// POST: Додати нову новину
app.post('/api/news', isAuthenticated, async (req, res) => {
    try {
        const newNews = new News(req.body);
        await newNews.save();
        res.status(201).json({ message: 'Новина успішно додана!', news: newNews });
    } catch (error) {
        console.error('Помилка при додаванні новини:', error);
        res.status(500).json({ message: 'Помилка сервера при додаванні новини.' });
    }
});

// PUT: Оновити існуючу новину
app.put('/api/news/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedNews = await News.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedNews) {
            return res.status(404).json({ message: 'Новину не знайдено.' });
        }
        res.status(200).json({ message: 'Новина успішно оновлена!', news: updatedNews });
    } catch (error) {
        console.error('Помилка при оновленні новини:', error);
        res.status(500).json({ message: 'Помилка сервера при оновленні новини.' });
    }
});

// DELETE: Видалити новину
app.delete('/api/news/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNews = await News.findOneAndDelete({ id: id });
        if (!deletedNews) {
            return res.status(404).json({ message: 'Новину не знайдено.' });
        }
        res.status(200).json({ message: 'Новина успішно видалена!' });
    } catch (error) {
        console.error('Помилка при видаленні новини:', error);
        res.status(500).json({ message: 'Помилка сервера при видаленні новини.' });
    }
});


// --- CRUD для категорій ---
// POST: Додати нову категорію
app.post('/api/categories', isAuthenticated, async (req, res) => {
    try {
        const newCategory = new Category(req.body);
        await newCategory.save();
        res.status(201).json({ message: 'Категорія успішно додана!', category: newCategory });
    } catch (error) {
        console.error('Помилка при додаванні категорії:', error);
        res.status(500).json({ message: 'Помилка сервера при додаванні категорії.' });
    }
});

// PUT: Оновити існуючу категорію
app.put('/api/categories/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCategory = await Category.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ message: 'Категорію не знайдено.' });
        }
        res.status(200).json({ message: 'Категорія успішно оновлена!', category: updatedCategory });
    } catch (error) {
        console.error('Помилка при оновленні категорії:', error);
        res.status(500).json({ message: 'Помилка сервера при оновленні категорії.' });
    }
});

// DELETE: Видалити категорію
app.delete('/api/categories/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await Category.findOneAndDelete({ id: id });
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Категорію не знайдено.' });
        }
        res.status(200).json({ message: 'Категорія успішно видалена!' });
    } catch (error) {
        console.error('Помилка при видаленні категорії:', error);
        res.status(500).json({ message: 'Помилка сервера при видаленні категорії.' });
    }
});


// --- CRUD для закладів ---
// POST: Додати новий заклад
app.post('/api/establishments', isAuthenticated, async (req, res) => {
    try {
        const newEstablishment = new Establishment(req.body);
        await newEstablishment.save();
        res.status(201).json({ message: 'Заклад успішно додано!', establishment: newEstablishment });
    } catch (error) {
        console.error('Помилка при додаванні закладу:', error);
        res.status(500).json({ message: 'Помилка сервера при додаванні закладу.' });
    }
});

// PUT: Оновити існуючий заклад
app.put('/api/establishments/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEstablishment = await Establishment.findOneAndUpdate({ id: id }, req.body, { new: true });
        if (!updatedEstablishment) {
            return res.status(404).json({ message: 'Заклад не знайдено.' });
        }
        res.status(200).json({ message: 'Заклад успішно оновлено!', establishment: updatedEstablishment });
    } catch (error) {
        console.error('Помилка при оновленні закладу:', error);
        res.status(500).json({ message: 'Помилка сервера при оновленні закладу.' });
    }
});

// DELETE: Видалити заклад
app.delete('/api/establishments/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEstablishment = await Establishment.findOneAndDelete({ id: id });
        if (!deletedEstablishment) {
            return res.status(404).json({ message: 'Заклад не знайдено.' });
        }
        res.status(200).json({ message: 'Заклад успішно видалено!' });
    } catch (error) {
        console.error('Помилка при видаленні закладу:', error);
        res.status(500).json({ message: 'Помилка сервера при видаленні закладу.' });
    }
});


// --- Оновлення контактів (завжди один запис) ---
app.post('/api/contacts', isAuthenticated, async (req, res) => {
    try {
        const newContactData = req.body;
        // Завжди оновлюємо (або створюємо) єдиний запис контактів з фіксованим ID
        const updatedContact = await Contact.findOneAndUpdate(
            { id: 'contacts' }, // Шукаємо запис з id 'contacts'
            { ...newContactData, id: 'contacts' }, // Оновлюємо дані, гарантуючи id
            { upsert: true, new: true } // upsert: true - створить, якщо не знайде, new: true - поверне оновлений документ
        );
        res.status(200).json({ message: 'Контактні дані успішно оновлені!', contacts: updatedContact });
    } catch (error) {
        console.error('Помилка при оновленні контактних даних:', error);
        res.status(500).json({ message: 'Помилка сервера при оновленні контактних даних.' });
    }
});


// --- API-точка для авторизації адміна ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Отримуємо облікові дані адміна зі змінних середовища Render
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAuthenticated = true; // Встановлюємо прапорець автентифікації в сесії
        res.json({ success: true, message: 'Вхід успішний!' });
    } else {
        res.status(401).json({ success: false, message: 'Неправильний логін або пароль.' });
    }
});

// API-точка для виходу
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Не вдалося вийти.' });
        }
        res.status(200).json({ message: 'Вихід успішний!' });
    });
});


// Додаємо маршрут для адмін-панелі
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Обробка інших маршрутів (fallback для SPA або 404)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на порті ${PORT}.`);
    console.log(`Для доступу до сайту перейдіть за публічним URL.`);
    console.log(`Для доступу до адмін-панелі: публічний URL/admin`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Помилка: Порт ${PORT} вже зайнятий.`);
    } else {
        console.error('Невідома помилка при запуску сервера:', err);
    }
    process.exit(1);
});