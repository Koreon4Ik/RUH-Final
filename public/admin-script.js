// admin-script.js

// Глобальна змінна для зберігання всіх даних з сервера
let adminData = {};

// --- Елементи DOM ---
const logoutBtn = document.getElementById('logoutBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Новини
const newsList = document.getElementById('newsList');
const addNewsBtn = document.getElementById('addNewsBtn');

// Заклади
const establishmentsList = document.getElementById('establishmentsList');
const addEstablishmentBtn = document.getElementById('addEstablishmentBtn');
const filterCategorySelect = document.getElementById('filterCategory');

// Категорії (НОВІ ЕЛЕМЕНТИ DOM)
const categoryList = document.getElementById('categoryList');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// Контакти
const contactsForm = document.getElementById('contactsForm');

// Модальне вікно для редагування/додавання
const editModal = document.getElementById('editModal');
const modalTitle = document.getElementById('modalTitle');
const editForm = document.getElementById('editForm');
// Важливо: перевіряємо, чи editModal існує, перед тим як намагатися знайти close-button
const closeButtonModal = editModal ? editModal.querySelector('.close-button') : null;


let currentEditingItem = null; // Зберігає об'єкт, який зараз редагується
let currentDataType = null; // Зберігає тип даних, які редагуються (news, establishments, categories, contacts)

// --- Функції керування даними та відображенням ---

/**
 * Функція для анімації тексту по літерах (може бути з script.js або продубльована)
 * Якщо ця функція вже є в `script.js` і `script.js` підключений в `admin.html`, її тут можна не дублювати.
 * Але для повної автономності `admin-script.js` її тут залишаємо.
 */
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
 * Перевіряє, чи авторизований користувач.
 * Примітка: для повноцінної адмін-панелі потрібна серверна перевірка сесії/токенів.
 * Наразі, якщо запит до /api/data повертає 401, ми перенаправляємо.
 */
function checkAuth() {
    // Ця функція поки що залишається заглушкою, бо авторизація відбувається на сервері
    // при спробі отримати дані, а не при завантаженні сторінки адмінки.
    // Якщо ти перезавантажуєш /admin вручну після виходу, сервер не знатиме, що ти адмін.
    // Поточна логіка обробляє 401 статус у loadAdminData().
}

/**
 * Завантажує всі дані з сервера для адмін-панелі.
 */
async function loadAdminData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            if (response.status === 401) {
                alert('Сесія закінчилася або не авторизовано. Будь ласка, увійдіть знову.');
                window.location.href = '/'; // Перенаправити на головну сторінку
                return;
            }
            throw new Error(`HTTP помилка! Статус: ${response.status}`);
        }
        adminData = await response.json();
        console.log('Дані адмін-панелі завантажено:', adminData);

        // Рендеримо дані для всіх вкладок при початковому завантаженні
        renderNewsAdmin();
        renderEstablishmentsAdmin();
        renderCategoriesAdmin(); // АКТИВОВАНО
        renderContactsAdmin();
        populateCategoryFilter(); // Заповнюємо фільтр категорій закладів

    } catch (error) {
        console.error('Помилка завантаження адмін-даних:', error);
        // Закоментував alert, оскільки він може з'являтися через тимчасові проблеми з'єднання
        // alert('Не вдалося завантажити дані адмін-панелі. Спробуйте оновити сторінку.');
    }
}

/**
 * Зберігає оновлені дані на сервер.
 */
async function saveDataToServer() {
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // У реальному проекті тут буде токен авторизації
            },
            body: JSON.stringify(adminData, null, 2), // Зберігаємо дані з відступами для читабельності
        });

        if (!response.ok) {
             if (response.status === 401) {
                alert('Сесія закінчилася. Будь ласка, увійдіть знову.');
                window.location.href = '/'; // Перенаправити на головну
                return;
            }
            throw new Error(`Помилка збереження! Статус: ${response.status}`);
        }

        const result = await response.json();
        alert(result.message); // Повідомлення від сервера про успішне збереження
        console.log('Дані успішно збережено на сервері.');
    } catch (error) {
        console.error('Помилка збереження даних на сервері:', error);
        alert('Помилка при збереженні даних на сервері.');
    }
}

// --- Новини ---
function renderNewsAdmin() {
    if (!newsList) return; // Запобіжник, якщо елемента немає

    newsList.innerHTML = '';
    if (adminData.news && adminData.news.length > 0) {
        adminData.news.forEach(newsItem => {
            const newsItemDiv = document.createElement('div');
            newsItemDiv.classList.add('data-item');
            newsItemDiv.innerHTML = `
                <div class="data-item-content">
                    <h4>${newsItem.title}</h4>
                    <p>${newsItem.description.substring(0, 100)}...</p>
                    <p class="news-date">${newsItem.date}</p>
                </div>
                <div class="data-item-actions">
                    <button class="action-button edit-button" data-id="${newsItem.id}">Редагувати</button>
                    <button class="action-button delete-button" data-id="${newsItem.id}">Видалити</button>
                </div>
            `;
            newsList.appendChild(newsItemDiv);
        });

        newsList.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => openEditModal('news', e.target.dataset.id));
        });
        newsList.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => deleteItem('news', e.target.dataset.id));
        });
    } else {
        newsList.innerHTML = '<p class="no-data-message">Новин поки немає в базі даних.</p>';
    }
}

if (addNewsBtn) {
    addNewsBtn.addEventListener('click', () => openEditModal('news', null)); // null для нового елемента
}


// --- Заклади ---
function renderEstablishmentsAdmin(filter = '') {
    if (!establishmentsList) return; // Запобіжник

    establishmentsList.innerHTML = '';
    const filtered = filter
        ? adminData.establishments.filter(est => est.category === filter)
        : adminData.establishments;

    if (filtered && filtered.length > 0) {
        filtered.forEach(est => {
            const estItemDiv = document.createElement('div');
            estItemDiv.classList.add('data-item');
            estItemDiv.innerHTML = `
                <div class="data-item-content">
                    <h4>${est.name} (${est.category})</h4>
                    <p>${est.address}</p>
                    <p>${est.discount}</p>
                </div>
                <div class="data-item-actions">
                    <button class="action-button edit-button" data-id="${est.id}">Редагувати</button>
                    <button class="action-button delete-button" data-id="${est.id}">Видалити</button>
                </div>
            `;
            establishmentsList.appendChild(estItemDiv);
        });

        establishmentsList.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => openEditModal('establishments', e.target.dataset.id));
        });
        establishmentsList.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => deleteItem('establishments', e.target.dataset.id));
        });
    } else {
        establishmentsList.innerHTML = '<p class="no-data-message">Закладів у цій категорії поки немає в базі даних.</p>';
    }
}

if (addEstablishmentBtn) {
    addEstablishmentBtn.addEventListener('click', () => openEditModal('establishments', null));
}

function populateCategoryFilter() {
    if (!filterCategorySelect) return;

    filterCategorySelect.innerHTML = '<option value="">Всі категорії</option>';
    if (adminData.categories && adminData.categories.length > 0) {
        // Створюємо унікальний відсортований список категорій
        const uniqueCategories = [...new Set(adminData.categories)].sort();
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategorySelect.appendChild(option);
        });
    }
    // Запускаємо фільтр за замовчуванням (Всі категорії)
    renderEstablishmentsAdmin(filterCategorySelect.value);
}


if (filterCategorySelect) {
    filterCategorySelect.addEventListener('change', (e) => {
        renderEstablishmentsAdmin(e.target.value);
    });
}


// --- Категорії (НОВИЙ БЛОК) ---
function renderCategoriesAdmin() {
    if (!categoryList) return;

    categoryList.innerHTML = '';
    if (adminData.categories && adminData.categories.length > 0) {
        adminData.categories.forEach(category => {
            const categoryItemDiv = document.createElement('div');
            categoryItemDiv.classList.add('data-item'); // Можна використати той же стиль, що для новин
            categoryItemDiv.innerHTML = `
                <div class="data-item-content">
                    <h4>${category}</h4>
                </div>
                <div class="data-item-actions">
                    <button class="action-button edit-button" data-name="${category}">Редагувати</button>
                    <button class="action-button delete-button" data-name="${category}">Видалити</button>
                </div>
            `;
            categoryList.appendChild(categoryItemDiv);
        });

        // Додаємо слухачі подій для кнопок редагування/видалення
        categoryList.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (e) => openEditModal('categories', e.target.dataset.name));
        });
        categoryList.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => deleteItem('categories', e.target.dataset.name));
        });
    } else {
        categoryList.innerHTML = '<p class="no-data-message">Категорій закладів поки немає в базі даних.</p>';
    }
}

if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => openEditModal('categories', null)); // null для нової категорії
}


// --- Контакти ---
function renderContactsAdmin() {
    if (!contactsForm) return; // Запобіжник

    contactsForm.innerHTML = ''; // Очищаємо контейнер
    const contacts = adminData.contacts;
    if (contacts) {
        contactsForm.innerHTML = `
            <div class="form-group">
                <label for="contactsPhone">Телефон:</label>
                <input type="tel" id="contactsPhone" name="phone" value="${contacts.phone || ''}" required>
            </div>
            <div class="form-group">
                <label for="contactsEmail">Email:</label>
                <input type="email" id="contactsEmail" name="email" value="${contacts.email || ''}" required>
            </div>
            <div class="form-group">
                <label for="contactsAddress">Адреса:</label>
                <input type="text" id="contactsAddress" name="address" value="${contacts.address || ''}" required>
            </div>
            <div class="form-group">
                <label for="contactsFacebook">Facebook URL:</label>
                <input type="url" id="contactsFacebook" name="facebook" value="${contacts.facebook || ''}">
            </div>
            <div class="form-group">
                <label for="contactsTelegram">Telegram URL:</label>
                <input type="url" id="contactsTelegram" name="telegram" value="${contacts.telegram || ''}">
            </div>
            <button type="submit" class="submit-button">Зберегти Контакти</button>
        `;
        contactsForm.removeEventListener('submit', handleContactsSubmit); // Видаляємо старий слухач
        contactsForm.addEventListener('submit', handleContactsSubmit); // Додаємо новий
    } else {
        contactsForm.innerHTML = '<p class="no-data-message">Контактна інформація відсутня. Додайте її.</p>';
        // Можна додати кнопку для ініціалізації порожніх контактів, якщо потрібно
    }
}

function handleContactsSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const updatedContacts = {};
    for (let [key, value] of formData.entries()) {
        updatedContacts[key] = value;
    }
    adminData.contacts = updatedContacts;
    saveDataToServer(); // Зберігаємо оновлені контакти
}

// --- Універсальне модальне вікно для редагування/додавання ---
function openEditModal(dataType, itemId = null) {
    if (!editModal || !modalTitle || !editForm) return; // Запобіжник

    currentDataType = dataType;
    currentEditingItem = null; // Скидаємо попередній елемент

    editForm.innerHTML = ''; // Очищаємо форму

    if (itemId) {
        modalTitle.textContent = `Редагувати ${dataType === 'news' ? 'новину' : dataType === 'establishments' ? 'заклад' : 'категорію'}`;
        // Для новин та закладів - шукаємо по ID
        if (dataType === 'news' || dataType === 'establishments') {
            currentEditingItem = adminData[dataType].find(item => item.id === itemId);
        } else if (dataType === 'categories') {
            // Для категорій 'id' - це сама назва категорії
            currentEditingItem = itemId;
        }
    } else {
        modalTitle.textContent = `Додати нову ${dataType === 'news' ? 'новину' : dataType === 'establishments' ? 'заклад' : 'категорію'}`;
    }

    // Динамічно генеруємо поля форми залежно від типу даних
    if (dataType === 'news') {
        editForm.innerHTML = `
            <div class="form-group">
                <label for="newsTitle">Заголовок:</label>
                <input type="text" id="newsTitle" name="title" value="${currentEditingItem ? currentEditingItem.title : ''}" required>
            </div>
            <div class="form-group">
                <label for="newsDescription">Опис:</label>
                <textarea id="newsDescription" name="description" rows="5" required>${currentEditingItem ? currentEditingItem.description : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="newsDate">Дата:</label>
                <input type="date" id="newsDate" name="date" value="${currentEditingItem ? formatDateForInput(currentEditingItem.date) : ''}" required>
            </div>
            <button type="submit" class="submit-button">Зберегти</button>
            <button type="button" class="action-button cancel-button">Скасувати</button>
        `;
    } else if (dataType === 'establishments') {
        // Перевіряємо, чи є категорії в adminData
        let categoryOptions = '';
        if (adminData.categories && adminData.categories.length > 0) {
            categoryOptions = adminData.categories.map(cat =>
                `<option value="${cat}" ${currentEditingItem && currentEditingItem.category === cat ? 'selected' : ''}>${cat}</option>`
            ).join('');
        } else {
            categoryOptions = '<option value="">Немає категорій</option>';
        }


        editForm.innerHTML = `
            <div class="form-group">
                <label for="estCategory">Категорія:</label>
                <select id="estCategory" name="category" required>
                    ${categoryOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="estName">Назва:</label>
                <input type="text" id="estName" name="name" value="${currentEditingItem ? currentEditingItem.name : ''}" required>
            </div>
            <div class="form-group">
                <label for="estAddress">Адреса:</label>
                <input type="text" id="estAddress" name="address" value="${currentEditingItem ? currentEditingItem.address : ''}" required>
            </div>
            <div class="form-group">
                <label for="estPhone">Телефон:</label>
                <input type="tel" id="estPhone" name="phone" value="${currentEditingItem ? currentEditingItem.phone : ''}">
            </div>
            <div class="form-group">
                <label for="estWebsite">Сайт/Соцмережі URL:</label>
                <input type="url" id="estWebsite" name="website" value="${currentEditingItem ? currentEditingItem.website : ''}">
            </div>
            <div class="form-group">
                <label for="estDescription">Опис:</label>
                <textarea id="estDescription" name="description" rows="3">${currentEditingItem ? currentEditingItem.description : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="estDiscount">Знижка/Умови:</label>
                <input type="text" id="estDiscount" name="discount" value="${currentEditingItem ? currentEditingItem.discount : ''}">
            </div>
            <button type="submit" class="submit-button">Зберегти</button>
            <button type="button" class="action-button cancel-button">Скасувати</button>
        `;
    } else if (dataType === 'categories') { // БЛОК ДЛЯ КАТЕГОРІЙ
        editForm.innerHTML = `
            <div class="form-group">
                <label for="categoryName">Назва Категорії:</label>
                <input type="text" id="categoryName" name="categoryName" value="${currentEditingItem || ''}" required>
            </div>
            <button type="submit" class="submit-button">Зберегти</button>
            <button type="button" class="action-button cancel-button">Скасувати</button>
        `;
    }

    // Додаємо слухачі подій для кнопок у модальному вікні
    const submitBtn = editForm.querySelector('.submit-button');
    const cancelBtn = editForm.querySelector('.cancel-button');

    if (submitBtn) {
        // Видаляємо попередні слухачі, щоб уникнути подвійного виклику
        submitBtn.removeEventListener('click', handleSubmitEditForm);
        submitBtn.addEventListener('click', handleSubmitEditForm);
    }
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', closeEditModal);
        cancelBtn.addEventListener('click', closeEditModal);
    }


    editModal.classList.add('show');
}

/**
 * Закриває модальне вікно редагування.
 */
function closeEditModal() {
    if (editModal) editModal.classList.remove('show');
    currentEditingItem = null;
    currentDataType = null;
    if (editForm) editForm.reset();
}

/**
 * Обробляє відправку форми додавання/редагування.
 */
function handleSubmitEditForm(event) {
    event.preventDefault();

    const formData = new FormData(editForm);
    let item = {};
    for (let [key, value] of formData.entries()) {
        item[key] = value;
    }

    if (currentDataType === 'news') {
        if (currentEditingItem) {
            Object.assign(currentEditingItem, item);
        } else {
            item.id = 'n' + Date.now();
            adminData.news.push(item);
        }
        renderNewsAdmin();
    } else if (currentDataType === 'establishments') {
        if (currentEditingItem) {
            Object.assign(currentEditingItem, item);
        } else {
            item.id = 'e' + Date.now();
            adminData.establishments.push(item);
        }
        renderEstablishmentsAdmin(filterCategorySelect ? filterCategorySelect.value : ''); // З фільтром, якщо він є
    } else if (currentDataType === 'categories') { // БЛОК ДЛЯ КАТЕГОРІЙ
        const oldCategoryName = currentEditingItem; // Зберігали стару назву тут
        const newCategoryName = item.categoryName.trim(); // Видаляємо пробіли

        if (!newCategoryName) {
            alert('Назва категорії не може бути порожньою!');
            return;
        }

        if (oldCategoryName) {
            // Редагування: оновлюємо назву категорії у всіх закладах
            adminData.establishments.forEach(est => {
                if (est.category === oldCategoryName) {
                    est.category = newCategoryName;
                }
            });
            // Оновлюємо назву категорії в самому списку категорій
            const index = adminData.categories.indexOf(oldCategoryName);
            if (index !== -1) {
                adminData.categories[index] = newCategoryName;
            }
        } else {
            // Додавання нової категорії
            if (!adminData.categories.includes(newCategoryName)) { // Перевірка на унікальність
                adminData.categories.push(newCategoryName);
            } else {
                alert('Категорія з такою назвою вже існує!');
                return; // Не зберігаємо, якщо категорія не унікальна
            }
        }
        // Після оновлення категорій, сортуємо їх
        adminData.categories.sort();
        renderCategoriesAdmin(); // Оновлюємо список категорій
        populateCategoryFilter(); // Оновлюємо фільтр закладів
    }

    saveDataToServer();
    closeEditModal();
}

/**
 * Видаляє елемент з масиву даних та оновлює відображення.
 */
function deleteItem(dataType, itemId) {
    if (!confirm(`Ви впевнені, що хочете видалити цей елемент?`)) {
        return;
    }

    if (dataType === 'news') {
        adminData.news = adminData.news.filter(item => item.id !== itemId);
        renderNewsAdmin();
    } else if (dataType === 'establishments') {
        adminData.establishments = adminData.establishments.filter(item => item.id !== itemId);
        renderEstablishmentsAdmin(filterCategorySelect ? filterCategorySelect.value : '');
    } else if (dataType === 'categories') { // БЛОК ДЛЯ КАТЕГОРІЙ
        const categoryToDelete = itemId; // itemId тут - це сама назва категорії

        // Попередження, якщо є заклади в цій категорії
        const establishmentsInCategory = adminData.establishments.filter(est => est.category === categoryToDelete);
        if (establishmentsInCategory.length > 0) {
            if (!confirm(`Категорія "${categoryToDelete}" містить ${establishmentsInCategory.length} закладів. Видалити категорію та видалити ці заклади?`)) {
                return; // Користувач відмовився
            }
            // Видаляємо заклади цієї категорії
            adminData.establishments = adminData.establishments.filter(est => est.category !== categoryToDelete);
        }

        // Видаляємо саму категорію
        adminData.categories = adminData.categories.filter(cat => cat !== categoryToDelete);
        renderCategoriesAdmin();
        populateCategoryFilter(); // Оновлюємо фільтр
    }
    saveDataToServer();
}

// --- Утиліти ---
// Перетворює дату з формату DD.MM.YYYY на YYYY-MM-DD для input type="date"
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('.');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
}

// --- Обробники подій ---

// Вкладки
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;

        tabContents.forEach(content => content.classList.remove('active'));
        tabButtons.forEach(btn => btn.classList.remove('active'));

        document.getElementById(`${tab}Tab`).classList.add('active');
        button.classList.add('active');

        // Оновлюємо відповідні списки при перемиканні
        if (tab === 'news') renderNewsAdmin();
        if (tab === 'establishments') renderEstablishmentsAdmin(filterCategorySelect ? filterCategorySelect.value : '');
        if (tab === 'categories') renderCategoriesAdmin(); // АКТИВОВАНО
        if (tab === 'contacts') renderContactsAdmin();
    });
});


// Кнопка виходу
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        alert('Ви вийшли з адмін-панелі.');
        window.location.href = '/'; // Перенаправлення на головну сторінку
    });
}

// Закриття модального вікна при натисканні на 'x'
if (closeButtonModal) {
    closeButtonModal.addEventListener('click', closeEditModal);
}


// Закриття модального вікна при натисканні поза ним
window.addEventListener('click', (event) => {
    if (editModal && event.target === editModal) {
        closeEditModal();
    }
});

// --- Ініціалізація ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Перевірка авторизації
    loadAdminData(); // Завантаження даних

    // Анімуємо заголовок "Адмін-панель"
    // Перевіряємо, чи функція animateText існує
    // Якщо animateText вже є в script.js і script.js підключений в admin.html, то ця перевірка не зайва.
    // Якщо script.js не підключений, то animateText має бути визначена тут.
    if (typeof animateText === 'function') {
        animateText('siteTitleAdmin', 'АДМІН-ПАНЕЛЬ');
    }
});