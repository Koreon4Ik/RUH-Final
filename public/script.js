// Глобальна змінна для зберігання всіх даних з сервера
let siteData = {};

// Функція для анімації тексту по літерах
function animateText(elementId, text) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.innerHTML = ''; // Очищаємо вміст перед анімацією
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.style.setProperty('--delay', `${index * 0.05}s`); // Затримка для кожної літери
        element.appendChild(span);
    });
}

/**
 * Завантажує всі дані з сервера (новини, заклади, контакти)
 */
async function loadSiteData() {
    try {
        const response = await fetch('/api/data'); // Звертаємося до нашого API-сервера
        if (!response.ok) {
            throw new Error(`HTTP помилка! Статус: ${response.status}`);
        }
        siteData = await response.json(); // Парсимо отримані дані як JSON
        console.log('Дані завантажено:', siteData);

        // Після завантаження даних, відображаємо їх на сторінці
        renderNews();
        renderCategories();
        renderContactInfo();
        // Завантажуємо заклади для першої категорії за замовчуванням
        if (siteData.categories && siteData.categories.length > 0) {
            displayEstablishments(siteData.categories[0]);
        }

        // Анімуємо заголовок на головній сторінці
        animateText('siteTitle', 'РУХ ВЕТЕРАНІВ'); // Заміни текст, якщо потрібно

    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        alert('Не вдалося завантажити дані сайту. Спробуйте оновити сторінку.');
    }
}

/**
 * Відображає новини на сторінці.
 */
function renderNews() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;

    newsContainer.innerHTML = ''; // Очищаємо контейнер перед додаванням нових елементів

    if (siteData.news && siteData.news.length > 0) {
        siteData.news.forEach(newsItem => {
            const newsCard = document.createElement('div');
            newsCard.classList.add('news-card');
            newsCard.innerHTML = `
                <h3>${newsItem.title}</h3>
                <p>${newsItem.description}</p>
                <p class="news-date">${newsItem.date}</p>
            `;
            newsContainer.appendChild(newsCard);
        });
    } else {
        newsContainer.innerHTML = '<p class="no-data-message">Новин поки немає.</p>';
    }
}

/**
 * Відображає кнопки категорій.
 */
function renderCategories() {
    const categoriesNav = document.getElementById('categoriesNav');
    if (!categoriesNav) return;

    categoriesNav.innerHTML = '';

    if (siteData.categories && siteData.categories.length > 0) {
        siteData.categories.forEach((category, index) => {
            const button = document.createElement('button');
            button.classList.add('category-button');
            button.textContent = category;
            button.dataset.category = category; // Зберігаємо назву категорії в data-атрибуті

            // Робимо першу категорію активною за замовчуванням
            if (index === 0) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                // Видаляємо клас 'active' з усіх кнопок
                document.querySelectorAll('.category-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Додаємо клас 'active' до натиснутої кнопки
                button.classList.add('active');
                displayEstablishments(category); // Відображаємо заклади для обраної категорії
            });
            categoriesNav.appendChild(button);
        });
    } else {
        categoriesNav.innerHTML = '<p class="no-data-message">Категорій закладів поки немає.</p>';
    }
}

/**
 * Відображає заклади для обраної категорії у таблиці.
 * @param {string} categoryName Назва категорії, заклади якої потрібно відобразити.
 */
function displayEstablishments(categoryName) {
    const tableBody = document.getElementById('establishmentsTable').querySelector('tbody');
    const noEstablishmentsMessage = document.getElementById('noEstablishmentsMessage');
    if (!tableBody || !noEstablishmentsMessage) return;

    tableBody.innerHTML = ''; // Очищаємо таблицю

    const filteredEstablishments = siteData.establishments.filter(
        est => est.category === categoryName
    );

    if (filteredEstablishments.length > 0) {
        noEstablishmentsMessage.style.display = 'none'; // Ховаємо повідомлення
        filteredEstablishments.forEach(establishment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${establishment.name}</td>
                <td>${establishment.address}</td>
                <td>${establishment.phone}</td>
                <td>
                    ${establishment.website ? `<a href="${establishment.website}" target="_blank">${new URL(establishment.website).hostname}</a>` : 'Немає'}
                </td>
                <td>${establishment.description}</td>
                <td>${establishment.discount}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        noEstablishmentsMessage.style.display = 'block'; // Показуємо повідомлення
    }
}

/**
 * Відображає контактну інформацію.
 */
function renderContactInfo() {
    const contactInfoDiv = document.getElementById('contactInfo');
    if (!contactInfoDiv) return;

    contactInfoDiv.innerHTML = ''; // Очищаємо контейнер

    const contacts = siteData.contacts;
    if (contacts) {
        contactInfoDiv.innerHTML = `
            <p><strong>Телефон:</strong> <a href="tel:${contacts.phone}">${contacts.phone}</a></p>
            <p><strong>Email:</strong> <a href="mailto:${contacts.email}">${contacts.email}</a></p>
            <p><strong>Адреса:</strong> ${contacts.address}</p>
            ${contacts.facebook ? `<p><strong>Facebook:</strong> <a href="${contacts.facebook}" target="_blank">Перейти</a></p>` : ''}
            ${contacts.telegram ? `<p><strong>Telegram:</strong> <a href="${contacts.telegram}" target="_blank">Перейти</a></p>` : ''}
        `;
    } else {
        contactInfoDiv.innerHTML = '<p class="no-data-message">Контактна інформація відсутня.</p>';
    }
}

// --- Функціонал модального вікна адмін-входу ---

const adminModal = document.getElementById('adminModal');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const closeButton = adminModal ? adminModal.querySelector('.close-button') : null; // Перевіряємо adminModal перед пошуком кнопки
const adminLoginForm = document.getElementById('adminLoginForm');
const loginMessage = document.getElementById('loginMessage');

// Відкриття модального вікна
if (adminLoginBtn) { // Перевірка, чи елемент існує, щоб уникнути помилок
    adminLoginBtn.addEventListener('click', () => {
        if (adminModal) {
            adminModal.classList.add('show');
            if (loginMessage) loginMessage.textContent = ''; // Очищаємо повідомлення про логін
            if (adminLoginForm) adminLoginForm.reset(); // Скидаємо поля форми
        }
    });
}

// Закриття модального вікна при натисканні на 'x'
if (closeButton) {
    closeButton.addEventListener('click', () => {
        if (adminModal) adminModal.classList.remove('show');
    });
}


// Закриття модального вікна при натисканні поза ним
window.addEventListener('click', (event) => {
    if (adminModal && event.target === adminModal) {
        if (closeButton) closeButton.click(); // Імітуємо натискання на кнопку закриття
    }
});

// Обробка форми входу адміна
if (adminLoginForm) { // Перевірка, чи елемент існує
    adminLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Запобігаємо стандартній відправці форми

        const username = adminLoginForm.username.value;
        const password = adminLoginForm.password.value;

        if (loginMessage) {
            loginMessage.textContent = 'Вхід...'; // Повідомлення про спробу входу
            loginMessage.style.color = '#004D40';
        }


        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (result.success) {
                if (loginMessage) {
                    loginMessage.textContent = result.message;
                    loginMessage.style.color = 'green';
                }
                // Успішний вхід: перенаправляємо на сторінку адмін-панелі
                setTimeout(() => {
                    window.location.href = '/admin'; // <--- ТУТ ПЕРЕНАПРАВЛЕННЯ
                }, 1000);
            } else {
                if (loginMessage) {
                    loginMessage.textContent = result.message;
                    loginMessage.style.color = 'red';
                }
            }
        } catch (error) {
            console.error('Помилка входу:', error);
            if (loginMessage) {
                loginMessage.textContent = 'Помилка мережі або сервера.';
                loginMessage.style.color = 'red';
            }
        }
    });
}


// --- Ініціалізація: Запуск завантаження даних при завантаженні сторінки ---
document.addEventListener('DOMContentLoaded', loadSiteData);