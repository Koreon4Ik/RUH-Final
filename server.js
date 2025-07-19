// server.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000; // Сервер буде працювати на порту, який надасть хостинг, або на 3000 за замовчуванням

// Шлях до файлу з даними
const dataFilePath = path.join(__dirname, 'data', 'data.json');

// Middleware для обробки JSON-даних у запитах
app.use(bodyParser.json());

// Middleware для обслуговування статичних файлів з папки 'public'
// Цей рядок має бути ДО будь-яких API маршрутів, щоб Express спочатку шукав файли у public
app.use(express.static(path.join(__dirname, 'public')));

// --- API-точки для роботи з даними ---

// Отримати всі дані (новини, категорії, заклади, контакти)
app.get('/api/data', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Помилка читання файлу даних:', err);
            // Якщо файл не знайдено, можливо, це перший запуск або проблема з деплоєм
            // Можна повернути порожній об'єкт або початкові дані
            if (err.code === 'ENOENT') { // ENOENT означає "Entity Not Found" (файл не знайдено)
                console.warn('Файл data.json не знайдено. Повертаю порожні дані.');
                return res.json({ news: [], categories: [], establishments: [], contacts: {}, admin: { username: 'admin', password: 'password' } });
            }
            return res.status(500).json({ message: 'Помилка сервера при читанні даних.' });
        }
        res.json(JSON.parse(data));
    });
});

// Оновити дані (для адмін-панелі)
app.post('/api/data', (req, res) => {
    const newData = req.body; // Очікуємо, що клієнт надішле оновлені дані
    fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Помилка запису файлу даних:', err);
            return res.status(500).json({ message: 'Помилка сервера при збереженні даних.' });
        }
        res.status(200).json({ message: 'Дані успішно оновлено!' });
    });
});

// --- API-точка для авторизації адміна ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Помилка читання файлу даних для логіну:', err);
            return res.status(500).json({ success: false, message: 'Помилка сервера при авторизації.' });
        }
        const jsonData = JSON.parse(data);
        const adminUser = jsonData.admin;

        // Важливо: у реальному проекті паролі не зберігаються у відкритому вигляді
        // та використовується хешування (наприклад, bcrypt)
        if (username === adminUser.username && password === adminUser.password) {
            // У реальному проекті тут потрібно генерувати токен (JWT) для автентифікації
            res.json({ success: true, message: 'Вхід успішний!' });
        } else {
            res.status(401).json({ success: false, message: 'Неправильний логін або пароль.' });
        }
    });
});

// Додаємо маршрут для адмін-панелі
// Важливо: цей маршрут повинен бути після `express.static`,
// але до `app.listen`, щоб Express міг його обробити
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    // Змінено повідомлення для кращої універсальності на хостингу
    console.log(`Сервер запущено на порті ${PORT}.`);
    console.log(`Для доступу до сайту перейдіть за публічним URL.`);
    console.log(`Для доступу до адмін-панелі: публічний URL/admin`);
}).on('error', (err) => { // Додаємо обробку помилок
    if (err.code === 'EADDRINUSE') {
        console.error(`Помилка: Порт ${PORT} вже зайнятий. Будь ласка, закрийте інші програми, що використовують цей порт, або оберіть інший порт.`);
    } else {
        console.error('Невідома помилка при запуску сервера:', err);
    }
    process.exit(1); // Вийти з процесу, якщо сервер не може запуститися
});