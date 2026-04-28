
const API_BASE = "http://localhost:5000/api";

async function loadDynamicContent() {
    // Load Services (Home page cards) - limit to 6
    const serviceContainer = document.querySelector('.serviceCard-container');
    if (serviceContainer) {
        const res = await fetch(`${API_BASE}/services`);
        const services = await res.json();
        const limitedServices = services.slice(0, 6);
        serviceContainer.innerHTML = limitedServices.map(s => `
            <div class="service-cards">
                <img src="${s.image || 'https://via.placeholder.com/400'}" alt="${s.title}">
                <div class="card-overlay">
                    <h3>${s.title}</h3>
                    <p>${s.description}</p>
                </div>
            </div>
        `).join('');
    }

    // Load Portfolio for Portfolio page (all items)
    const portfolioContainer = document.querySelector('.project-grid') || document.querySelector('.portfolio-container') || document.querySelector('.projects-grid');
    if (portfolioContainer && !portfolioContainer.classList.contains('home-portfolio-container')) {
        const res = await fetch(`${API_BASE}/portfolio`);
        const portfolio = await res.json();
        portfolioContainer.innerHTML = portfolio.map(p => `
            <div class="project-card" data-category="${p.category}">
                <div class="project-image">
                    <img src="${p.image || 'https://via.placeholder.com/600'}" alt="${p.title}">
                    <div class="project-overlay">
                        <a href="${p.link || '#'}" class="view-project" target="_blank"><i class="ri-arrow-right-up-line"></i></a>
                    </div>
                </div>
                <div class="project-info">
                    <span class="project-cat">${p.category || 'Project'}</span>
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                </div>
            </div>
        `).join('');
    }

    // Load Portfolio for Home page (limit to 3)
    const homePortfolioContainer = document.querySelector('.home-portfolio-container');
    if (homePortfolioContainer) {
        const res = await fetch(`${API_BASE}/portfolio`);
        const portfolio = await res.json();
        const limitedPortfolio = portfolio.slice(0, 3);
        homePortfolioContainer.innerHTML = limitedPortfolio.map(p => `
            <div class="home-project-card">
                <div class="home-project-image">
                    <img src="${p.image || 'https://via.placeholder.com/600'}" alt="${p.title}">
                    <div class="home-project-overlay">
                        <a href="${p.link || '#'}" class="view-project" target="_blank"><i class="ri-arrow-right-up-line"></i></a>
                    </div>
                </div>
                <div class="home-project-info">
                    <span class="home-project-cat">${p.category || 'Project'}</span>
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                </div>
            </div>
        `).join('');
    }

    initPortfolioFilters();
}

async function loadServicesPage() {
    const servicesList = document.querySelector('.services-list');
    if (!servicesList) return;

    const res = await fetch(`${API_BASE}/services`);
    const services = await res.json();

    servicesList.innerHTML = services.map((s, index) => {
        const num = String(index + 1).padStart(2, '0');
        const featuresHtml = (s.features || []).map(f => `<span class="tag">${f}</span>`).join('');
        return `
            <div class="service-item">
                <div class="service-body">
                    <div class="service-body-left">
                        <div class="service-title-row">
                            <div class="service-icon"><i class="${s.icon || 'ri-code-s-slash-line'}"></i></div>
                            <h3 class="service-name">${s.title}</h3>
                        </div>
                        <p class="service-desc">${s.description}</p>
                        <div class="service-features">
                            ${featuresHtml}
                        </div>
                    </div>
                    <div class="service-body-right">
                        <img src="${s.image || '/frontend/assets/consultation.webp'}" alt="${s.title}">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* =============================================
   PORTFOLIO FILTERING & STAGGER
   ============================================= */
function initPortfolioFilters() {
    const filters = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');

    if (!filters.length || !cards.length) return;

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            gsap.to(cards, {
                scale: 0.8,
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    cards.forEach(card => {
                        if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    });

                    gsap.to('.project-card[style*="display: block"]', {
                        scale: 1,
                        opacity: 1,
                        stagger: 0.1,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                }
            });
        });
    });
}

initPortfolioFilters();

/* =============================================
   BLOG FILTERING
   ============================================= */
function initBlogFilters() {
    const filterContainer = document.querySelector('.blog-filters');
    if (!filterContainer) return;

    // Remove old listeners by replacing container with clone (simplest way)
    const newContainer = filterContainer.cloneNode(true);
    filterContainer.parentNode.replaceChild(newContainer, filterContainer);

    newContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.blog-filter-btn');
        if (!btn) return;

        newContainer.querySelectorAll('.blog-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');
        const cards = document.querySelectorAll('.article-card');

        gsap.to(cards, {
            scale: 0.9,
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                cards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });

                gsap.to('.article-card[style*="display: block"]', {
                    scale: 1,
                    opacity: 1,
                    stagger: 0.08,
                    duration: 0.4,
                    ease: "power2.out"
                });
            }
        });

        // Reset visible count when filter changes
        if (typeof window !== 'undefined' && window.resetBlogVisibleCount) {
            window.resetBlogVisibleCount();
        }
    });
}

function resetBlogVisibleCount() {
    window.blogVisibleCount = 4;
}

/* =============================================
   FORM VALIDATION LOGIC
   ============================================= */
function initFormValidation() {
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const showSuccess = (msg) => alert(msg);
    const showError = (message) => alert(message);

    const contactFormBtn = document.querySelector('.contact-form .btn-primary');
    const consultFormBtn = document.querySelector('.book-consultation .btn-primary');

    if (contactFormBtn) {
        contactFormBtn.addEventListener('click', (e) => {
            const parent = contactFormBtn.closest('.form-inner');
            const firstName = parent.querySelector('input[name="first-name"]').value.trim();
            const email = parent.querySelector('input[name="email"]').value.trim();
            const message = parent.querySelector('textarea').value.trim();

            if (!firstName || !email || !message) {
                showError("Please fill in all fields.");
            } else if (!isValidEmail(email)) {
                showError("Please enter a valid email address.");
            } else {
                fetch(`${API_BASE}/leads`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, email, message })
                })
                    .then(res => res.json())
                    .then(() => {
                        showSuccess("Message sent! Our team will contact you soon.");
                        parent.querySelector('input[name="first-name"]').value = '';
                        parent.querySelector('input[name="email"]').value = '';
                        parent.querySelector('textarea').value = '';
                    })
                    .catch(() => showError("Submission failed. Please try again later."));
            }
        });
    }

    if (consultFormBtn) {
        consultFormBtn.addEventListener('click', (e) => {
            const parent = consultFormBtn.closest('.form-inner');
            const firstName = parent.querySelector('input[name="first-name"]').value.trim();
            const email = parent.querySelector('input[name="email"]').value.trim();
            const date = parent.querySelector('input[type="date"]').value;
            const time = parent.querySelector('input[type="time"]').value;

            if (!firstName || !email || !date || !time) {
                showError("Please complete your consultation details.");
            } else if (!isValidEmail(email)) {
                showError("Please enter a valid email address.");
            } else {
                fetch(`${API_BASE}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firstName, email, date, time })
                })
                    .then(res => res.json())
                    .then(() => showSuccess("Consultation scheduled successfully!"))
                    .catch(() => showError("Booking failed. Please try again."));
            }
        });
    }

    const authForms = document.querySelectorAll('.auth-form');
    authForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input[type="email"]').value.trim();
            const password = form.querySelector('input[type="password"]').value;
            const nameField = form.querySelector('input[type="text"]');
            const confirmPassField = form.querySelector('#confirm-password');

            if (!email || !password) return showError("Email and Password are required.");
            if (!isValidEmail(email)) return showError("Invalid email format.");
            if (nameField && !nameField.value.trim()) return showError("Please enter your full name.");

            if (confirmPassField) {
                if (password.length < 8) return showError("Password must be at least 8 characters long.");
                if (password !== confirmPassField.value) return showError("Passwords do not match.");
            }

            const mode = confirmPassField ? "register" : "login";
            const endpoint = `${API_BASE}/auth/${mode}`;

            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.token) {
                        alert(`${mode === 'register' ? 'Registration' : 'Login'} successful! Redirecting...`);
                        window.location.href = '/frontend/views/Home.html';
                    } else {
                        showError(data.message || `${mode === 'register' ? 'Registration' : 'Login'} failed.`);
                    }
                })
                .catch(() => showError("Server error. Please try again later."));
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initFormValidation();
    loadDynamicContent();
    loadServicesPage();
    initBlogFilters();
});
