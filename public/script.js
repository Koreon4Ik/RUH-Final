// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const newsContainer = document.getElementById('newsContainer');
    const categoriesSection = document.getElementById('categories-section');
    const allCategoriesContainer = document.getElementById('allCategoriesContainer');
    const contactInfo = document.getElementById('contactInfo');
    const loadingCategoriesMessage = document.getElementById('loadingCategoriesMessage');

    // Burger menu elements
    const burgerMenuBtn = document.getElementById('burgerMenuBtn');
    const mainMenu = document.getElementById('mainMenu');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const menuCategoriesList = document.getElementById('menuCategoriesList');
    const adminLoginMenuLink = document.getElementById('adminLoginMenuLink');

    // Admin modal elements
    const adminModal = document.getElementById('adminModal');
    const closeButton = adminModal ? adminModal.querySelector('.close-button') : null;
    const adminLoginForm = document.getElementById('adminLoginForm');
    const loginMessage = document.getElementById('loginMessage');

    // --- Helper Functions ---

    function showAlert(message, type = 'success') {
        const alertBox = document.createElement('div');
        alertBox.className = `alert ${type}`;
        alertBox.textContent = message;
        document.body.prepend(alertBox);
        setTimeout(() => {
            alertBox.remove();
        }, 3000);
    }

    // --- Burger Menu Logic ---

    if (burgerMenuBtn && mainMenu && closeMenuBtn) {
        burgerMenuBtn.addEventListener('click', () => {
            mainMenu.classList.add('open');
            // Optional: add an overlay to darken background
            // const overlay = document.createElement('div');
            // overlay.className = 'overlay visible';
            // document.body.appendChild(overlay);
        });

        closeMenuBtn.addEventListener('click', () => {
            mainMenu.classList.remove('open');
            // Optional: remove overlay
            // const overlay = document.querySelector('.overlay');
            // if (overlay) overlay.remove();
        });

        // Close menu when clicking outside (on overlay) or on a menu link
        mainMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('menu-link')) {
                mainMenu.classList.remove('open');
                // if (document.querySelector('.overlay')) document.querySelector('.overlay').remove();
            }
        });
    }

    // --- Admin Login Modal Logic ---

    if (adminLoginMenuLink && adminModal) {
        adminLoginMenuLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            adminModal.style.display = 'flex'; // Show modal
        });
    }

    if (closeButton && adminModal) {
        closeButton.addEventListener('click', () => {
            adminModal.style.display = 'none'; // Hide modal
        });
    }

    // Close modal if clicked outside of content
    if (adminModal) {
        window.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.style.display = 'none';
            }
        });
    }

    // Handle admin login form submission
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('usernameModal').value;
            const password = document.getElementById('passwordModal').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    loginMessage.textContent = data.message;
                    loginMessage.style.color = 'green';
                    showAlert(data.message, 'success');
                    adminModal.style.display = 'none'; // Hide modal on success
                    window.location.href = '/admin'; // Redirect to admin panel
                } else {
                    loginMessage.textContent = data.message;
                    loginMessage.style.color = 'red';
                    showAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessage.textContent = 'Помилка входу. Спробуйте ще раз.';
                loginMessage.style.color = 'red';
                showAlert('Помилка входу. Спробуйте ще раз.', 'error');
            }
        });
    }


    // --- Load Data from Backend ---

    async function loadAllContent() {
        try {
            // Fetch all data from the /api/data endpoint
            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Fetched All Data:", data); // Debugging

            displayNews(data.news);
            displayCategoriesAndEstablishments(data.categories, data.establishments);
            populateContactInfo(data.contacts);
            populateMenuCategories(data.categories);

        } catch (error) {
            console.error('Error loading all content:', error);
            showAlert('Помилка завантаження даних сайту. ' + error.message, 'error');
            // Fallback for UI if data fails to load
            newsContainer.innerHTML = '<p>Не вдалося завантажити новини.</p>';
            allCategoriesContainer.innerHTML = '<p>Не вдалося завантажити категорії та заклади.</p>';
            contactInfo.innerHTML = '<p>Не вдалося завантажити контактну інформацію.</p>';
        } finally {
            if (loadingCategoriesMessage) {
                loadingCategoriesMessage.style.display = 'none';
            }
        }
    }

    // --- Display News ---

    function displayNews(newsItems) {
        if (!newsContainer) return;

        newsContainer.innerHTML = ''; // Clear previous news
        if (newsItems && newsItems.length > 0) {
            // Sort news by date descending (newest first)
            newsItems.sort((a, b) => new Date(b.date) - new Date(a.date));

            newsItems.forEach(news => {
                const newsItemDiv = document.createElement('div');
                newsItemDiv.classList.add('news-item');
                newsItemDiv.innerHTML = `
                    <h3>${news.title}</h3>
                    <p class="news-date">${news.date}</p>
                    ${news.image ? `<img src="${news.image}" alt="${news.title}">` : ''}
                    <p>${news.shortDescription}</p>
                    `;
                newsContainer.appendChild(newsItemDiv);
            });
        } else {
            newsContainer.innerHTML = '<p>Наразі новин немає.</p>';
        }
    }

    // --- Display Categories in Menu ---

    function populateMenuCategories(categories) {
        if (!menuCategoriesList) return;

        menuCategoriesList.innerHTML = '';
        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#category-${category.id}" class="menu-link sub-menu-link">${category.name}</a>`;
                menuCategoriesList.appendChild(li);
            });
            // Show sub-menu if categories are loaded
            // Find the parent <li> of menuCategoriesList and add a click listener to toggle sub-menu visibility
            const parentLi = menuCategoriesList.closest('li');
            if(parentLi) {
                const categoriesLink = parentLi.querySelector('a.menu-link');
                if (categoriesLink) {
                    categoriesLink.addEventListener('click', (e) => {
                        e.preventDefault(); // Prevent scrolling to categories-section directly first
                        menuCategoriesList.classList.toggle('open');
                        // Optional: Scroll to the main categories section after small delay
                        setTimeout(() => {
                            document.getElementById('categories-section').scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    });
                }
            }
        } else {
            menuCategoriesList.innerHTML = '<li>Категорій немає</li>';
        }
    }


    // --- Display Categories and Establishments on Main Content ---

    function displayCategoriesAndEstablishments(categories, establishments) {
        if (!allCategoriesContainer) return;

        allCategoriesContainer.innerHTML = ''; // Clear previous content

        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const categoryBlock = document.createElement('div');
                categoryBlock.classList.add('category-block');
                categoryBlock.id = `category-${category.id}`; // For direct linking from menu

                categoryBlock.innerHTML = `<h3>${category.name}</h3>`;

                const categoryEstablishments = establishments.filter(est => est.type === category.name);

                if (categoryEstablishments && categoryEstablishments.length > 0) {
                    const tableContainer = document.createElement('div');
                    tableContainer.classList.add('establishments-table-container');

                    const table = document.createElement('table');
                    table.classList.add('establishments-table');
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Назва</th>
                                <th>Адреса</th>
                                <th>Телефон</th>
                                <th>Сайт/Соцмережі</th>
                                <th>Опис</th>
                                <th>Додаткова інформація</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    const tbody = table.querySelector('tbody');

                    categoryEstablishments.forEach(est => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${est.name || ''}</td>
                            <td>${est.address || ''}</td>
                            <td>${est.phone || ''}</td>
                            <td>
                                ${est.facebook ? `<a href="${est.facebook}" target="_blank">Facebook</a><br>` : ''}
                                ${est.instagram ? `<a href="${est.instagram}" target="_blank">Instagram</a><br>` : ''}
                                </td>
                            <td>${est.description || ''}</td>
                            <td>${est.workingHours || ''}</td>
                            `;
                        tbody.appendChild(tr);
                    });
                    tableContainer.appendChild(table);
                    categoryBlock.appendChild(tableContainer);
                } else {
                    const noEstablishmentsMessage = document.createElement('p');
                    noEstablishmentsMessage.classList.add('no-data-message');
                    noEstablishmentsMessage.textContent = `Вибачте, закладів у категорії "${category.name}" поки немає.`;
                    categoryBlock.appendChild(noEstablishmentsMessage);
                }
                allCategoriesContainer.appendChild(categoryBlock);
            });
        } else {
            allCategoriesContainer.innerHTML = '<p>Наразі категорії закладів відсутні.</p>';
        }
    }


    // --- Populate Contact Info ---

    function populateContactInfo(contactsData) {
        if (!contactInfo) return;

        contactInfo.innerHTML = ''; // Clear previous content
        if (contactsData) {
            contactInfo.innerHTML = `
                <p><strong>Адреса:</strong> ${contactsData.address || 'Не вказано'}</p>
                <p><strong>Телефон:</strong> ${contactsData.phone || 'Не вказано'}</p>
                <p><strong>Email:</strong> ${contactsData.email ? `<a href="mailto:${contactsData.email}">${contactsData.email}</a>` : 'Не вказано'}</p>
                ${contactsData.facebook ? `<p><strong>Facebook:</strong> <a href="${contactsData.facebook}" target="_blank">${contactsData.facebook}</a></p>` : ''}
                ${contactsData.telegram ? `<p><strong>Telegram:</strong> <a href="${contactsData.telegram}" target="_blank">${contactsData.telegram}</a></p>` : ''}
                ${contactsData.instagram ? `<p><strong>Instagram:</strong> <a href="${contactsData.instagram}" target="_blank">${contactsData.instagram}</a></p>` : ''}
            `;
        } else {
            contactInfo.innerHTML = '<p>Контактна інформація відсутня.</p>';
        }
    }


    // --- Initial Data Load ---
    loadAllContent();
});