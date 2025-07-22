// public/admin-script.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    const logoutBtn = document.getElementById('logoutBtn');

    const newsForm = document.getElementById('newsForm');
    const newsList = document.getElementById('newsList');

    const categoryForm = document.getElementById('categoryForm');
    const categoryList = document.getElementById('categoryList');

    const establishmentForm = document.getElementById('establishmentForm');
    const establishmentList = document.getElementById('establishmentList');

    const contactsForm = document.getElementById('contactsForm');

    // Show/Hide admin panel sections
    const navLinks = document.querySelectorAll('.admin-nav button');
    const adminSections = document.querySelectorAll('.admin-section');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            adminSections.forEach(section => section.classList.remove('active'));
            document.getElementById(link.dataset.section).classList.add('active');
        });
    });


    // --- Helper Functions ---

    // Function to show alerts (for success/error messages)
    function showAlert(message, type = 'success') {
        const alertBox = document.createElement('div');
        alertBox.className = `alert ${type}`;
        alertBox.textContent = message;
        document.body.prepend(alertBox); // Add to the top of the body
        setTimeout(() => {
            alertBox.remove();
        }, 3000);
    }

    // Function to generate a unique ID (simple for now)
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // --- Admin Authentication ---

    // Check session on page load
    async function checkSession() {
        try {
            const response = await fetch('/api/data'); // Use /api/data to check if session is active via admin data
            if (response.ok) {
                const data = await response.json();
                // If we get admin data, it means we are authenticated (simple check)
                if (data.admin && data.admin.username) {
                    showAdminPanel();
                    loadAllData();
                } else {
                    showLoginForm();
                }
            } else {
                showLoginForm(); // Not authenticated
            }
        } catch (error) {
            console.error('Error checking session:', error);
            showLoginForm();
        }
    }

    // Show login form, hide admin panel
    function showLoginForm() {
        loginForm.style.display = 'block';
        adminPanel.style.display = 'none';
    }

    // Show admin panel, hide login form
    function showAdminPanel() {
        loginForm.style.display = 'none';
        adminPanel.style.display = 'block';
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    showAlert(data.message, 'success');
                    showAdminPanel();
                    loadAllData(); // Load data after successful login
                } else {
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showAlert('Помилка входу. Спробуйте ще раз.', 'error');
            }
        });
    }

    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                const data = await response.json();
                if (response.ok) {
                    showAlert(data.message, 'success');
                    showLoginForm();
                } else {
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('Logout error:', error);
                showAlert('Помилка виходу.', 'error');
            }
        });
    }


    // --- Load All Data ---
    async function loadAllData() {
        try {
            const response = await fetch('/api/data'); // General endpoint to fetch all admin data
            if (!response.ok) {
                if (response.status === 401) {
                    showLoginForm();
                    showAlert('Сесія закінчилася. Будь ласка, увійдіть знову.', 'error');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched Data:', data); // Debugging

            // Populate forms and lists
            displayNews(data.news);
            displayCategories(data.categories);
            displayEstablishments(data.establishments);
            populateContactsForm(data.contacts);

        } catch (error) {
            console.error('Error loading all data:', error);
            showAlert('Помилка завантаження даних. ' + error.message, 'error');
            showLoginForm(); // Redirect to login on load error
        }
    }


    // --- News Management ---

    // Display news items
    function displayNews(newsItems) {
        newsList.innerHTML = '';
        if (newsItems && newsItems.length > 0) {
            newsItems.forEach(news => {
                const li = document.createElement('li');
                li.dataset.id = news.id;
                li.innerHTML = `
                    <span>${news.title} (${news.date})</span>
                    <div>
                        <button class="edit-btn" data-type="news" data-id="${news.id}">Редагувати</button>
                        <button class="delete-btn" data-type="news" data-id="${news.id}">Видалити</button>
                    </div>
                `;
                newsList.appendChild(li);
            });
        } else {
            newsList.innerHTML = '<li>Новин поки немає.</li>';
        }
    }

    // Handle news form submission (Add/Edit)
    if (newsForm) {
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = e.target.newsId.value;
            const title = e.target.newsTitle.value;
            const date = e.target.newsDate.value;
            const shortDescription = e.target.newsShortDescription.value;
            const fullDescription = e.target.newsFullDescription.value;
            const image = e.target.newsImage.value;

            const newsData = { id, title, date, shortDescription, fullDescription, image };

            try {
                let response;
                if (id) { // Editing existing news
                    response = await fetch(`/api/news/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newsData),
                    });
                } else { // Adding new news
                    newsData.id = generateUniqueId(); // Generate ID for new entry
                    response = await fetch('/api/news', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newsData),
                    });
                }

                const result = await response.json();
                if (response.ok) {
                    showAlert(result.message, 'success');
                    newsForm.reset();
                    e.target.newsId.value = ''; // Clear hidden ID field
                    loadAllData(); // Reload all data
                } else {
                    showAlert(result.message, 'error');
                }
            } catch (error) {
                console.error('Error saving news:', error);
                showAlert('Помилка при збереженні новини. ' + error.message, 'error');
            }
        });
    }

    // --- Category Management ---

    // Display categories
    function displayCategories(categoryItems) {
        categoryList.innerHTML = '';
        if (categoryItems && categoryItems.length > 0) {
            categoryItems.forEach(cat => {
                const li = document.createElement('li');
                li.dataset.id = cat.id;
                li.innerHTML = `
                    <span>${cat.name}</span>
                    <div>
                        <button class="edit-btn" data-type="category" data-id="${cat.id}">Редагувати</button>
                        <button class="delete-btn" data-type="category" data-id="${cat.id}">Видалити</button>
                    </div>
                `;
                categoryList.appendChild(li);
            });
        } else {
            categoryList.innerHTML = '<li>Категорій поки немає.</li>';
        }
    }

    // Handle category form submission (Add/Edit)
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = e.target.categoryId.value;
            const name = e.target.categoryName.value;

            const categoryData = { id, name };

            try {
                let response;
                if (id) { // Editing existing category
                    response = await fetch(`/api/categories/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(categoryData),
                    });
                } else { // Adding new category
                    categoryData.id = generateUniqueId(); // Generate ID for new entry
                    response = await fetch('/api/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(categoryData),
                    });
                }

                const result = await response.json();
                if (response.ok) {
                    showAlert(result.message, 'success');
                    categoryForm.reset();
                    e.target.categoryId.value = ''; // Clear hidden ID field
                    loadAllData();
                } else {
                    showAlert(result.message, 'error');
                }
            } catch (error) {
                console.error('Error saving category:', error);
                showAlert('Помилка при збереженні категорії. ' + error.message, 'error');
            }
        });
    }

    // --- Establishment Management ---

    // Display establishments
    function displayEstablishments(establishmentItems) {
        establishmentList.innerHTML = '';
        if (establishmentItems && establishmentItems.length > 0) {
            establishmentItems.forEach(est => {
                const li = document.createElement('li');
                li.dataset.id = est.id;
                li.innerHTML = `
                    <span>${est.name} (${est.type})</span>
                    <div>
                        <button class="edit-btn" data-type="establishment" data-id="${est.id}">Редагувати</button>
                        <button class="delete-btn" data-type="establishment" data-id="${est.id}">Видалити</button>
                    </div>
                `;
                establishmentList.appendChild(li);
            });
        } else {
            establishmentList.innerHTML = '<li>Закладів поки немає.</li>';
        }
    }

    // Handle establishment form submission (Add/Edit)
    if (establishmentForm) {
        establishmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = e.target.establishmentId.value;
            const name = e.target.establishmentName.value;
            const type = e.target.establishmentType.value;
            const address = e.target.establishmentAddress.value;
            const phone = e.target.establishmentPhone.value;
            const workingHours = e.target.establishmentWorkingHours.value;
            const description = e.target.establishmentDescription.value;
            const image = e.target.establishmentImage.value;
            const latitude = parseFloat(e.target.establishmentLatitude.value);
            const longitude = parseFloat(e.target.establishmentLongitude.value);

            const establishmentData = {
                id, name, type, address, phone, workingHours, description, image,
                coordinates: { latitude, longitude }
            };

            try {
                let response;
                if (id) { // Editing existing establishment
                    response = await fetch(`/api/establishments/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(establishmentData),
                    });
                } else { // Adding new establishment
                    establishmentData.id = generateUniqueId(); // Generate ID for new entry
                    response = await fetch('/api/establishments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(establishmentData),
                    });
                }

                const result = await response.json();
                if (response.ok) {
                    showAlert(result.message, 'success');
                    establishmentForm.reset();
                    e.target.establishmentId.value = ''; // Clear hidden ID field
                    loadAllData();
                } else {
                    showAlert(result.message, 'error');
                }
            } catch (error) {
                console.error('Error saving establishment:', error);
                showAlert('Помилка при збереженні закладу. ' + error.message, 'error');
            }
        });
    }

    // --- Contacts Management ---

    // Populate contacts form with current data
    function populateContactsForm(contactsData) {
        if (contactsData && contactsForm) {
            contactsForm.address.value = contactsData.address || '';
            contactsForm.phone.value = contactsData.phone || '';
            contactsForm.email.value = contactsData.email || '';
            contactsForm.facebook.value = contactsData.facebook || '';
            contactsForm.telegram.value = contactsData.telegram || '';
            contactsForm.instagram.value = contactsData.instagram || '';
        }
    }

    // Handle contacts form submission
    if (contactsForm) {
        contactsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const contactsData = {
                address: e.target.address.value,
                phone: e.target.phone.value,
                email: e.target.email.value,
                facebook: e.target.facebook.value,
                telegram: e.target.telegram.value,
                instagram: e.target.instagram.value,
            };

            try {
                const response = await fetch('/api/contacts', {
                    method: 'POST', // Use POST for contacts update (upsert on backend)
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactsData),
                });

                const result = await response.json();
                if (response.ok) {
                    showAlert(result.message, 'success');
                    loadAllData(); // Reload to ensure consistent data (though not strictly necessary here)
                } else {
                    showAlert(result.message, 'error');
                }
            } catch (error) {
                console.error('Error saving contacts:', error);
                showAlert('Помилка при збереженні контактів. ' + error.message, 'error');
            }
        });
    }

    // --- Universal Edit/Delete Handlers (Event Delegation) ---

    // Event listener for edit/delete buttons on lists
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;
            const item = await getItemToEdit(type, id);
            if (item) {
                populateFormForEdit(type, item);
            }
        } else if (e.target.classList.contains('delete-btn')) {
            const type = e.target.dataset.type;
            const id = e.target.dataset.id;
            if (confirm(`Ви впевнені, що хочете видалити цей елемент (${type}: ${id})?`)) {
                deleteItem(type, id);
            }
        }
    });

    // Fetch single item for editing
    async function getItemToEdit(type, id) {
        try {
            const response = await fetch('/api/data'); // Fetch all data
            if (!response.ok) throw new Error('Failed to fetch data for editing.');
            const data = await response.json();
            return data[type + 's'].find(item => item.id === id); // Find in appropriate array (news, categories, establishments)
        } catch (error) {
            console.error(`Error fetching ${type} for edit:`, error);
            showAlert(`Помилка отримання ${type} для редагування.`, 'error');
            return null;
        }
    }

    // Populate form fields for editing
    function populateFormForEdit(type, item) {
        if (!item) return;

        switch (type) {
            case 'news':
                newsForm.newsId.value = item.id;
                newsForm.newsTitle.value = item.title;
                newsForm.newsDate.value = item.date;
                newsForm.newsShortDescription.value = item.shortDescription;
                newsForm.newsFullDescription.value = item.fullDescription;
                newsForm.newsImage.value = item.image;
                break;
            case 'category':
                categoryForm.categoryId.value = item.id;
                categoryForm.categoryName.value = item.name;
                break;
            case 'establishment':
                establishmentForm.establishmentId.value = item.id;
                establishmentForm.establishmentName.value = item.name;
                establishmentForm.establishmentType.value = item.type;
                establishmentForm.establishmentAddress.value = item.address;
                establishmentForm.establishmentPhone.value = item.phone;
                establishmentForm.establishmentWorkingHours.value = item.workingHours;
                establishmentForm.establishmentDescription.value = item.description;
                establishmentForm.establishmentImage.value = item.image;
                establishmentForm.establishmentLatitude.value = item.coordinates ? item.coordinates.latitude : '';
                establishmentForm.establishmentLongitude.value = item.coordinates ? item.coordinates.longitude : '';
                break;
        }
        // Scroll to the form
        document.getElementById(`${type}Form`).scrollIntoView({ behavior: 'smooth' });
    }

    // Delete item function
    async function deleteItem(type, id) {
        try {
            const response = await fetch(`/api/${type}s/${id}`, { // e.g., /api/news/123, /api/categories/456
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            if (response.ok) {
                showAlert(result.message, 'success');
                loadAllData(); // Reload data after deletion
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            showAlert(`Помилка при видаленні ${type}. ` + error.message, 'error');
        }
    }


    // Initial load/check
    checkSession(); // Check authentication status on page load
});