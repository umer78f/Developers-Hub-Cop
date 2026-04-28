const token = localStorage.getItem('adminToken');
if (!token) window.location.href = 'login.html';

const API_BASE = "http://localhost:5000/api";
let currentSection = 'portfolio';
let editingId = null;
let currentImageUrl = '';

const getHeaders = () => ({ 'Authorization': `Bearer ${token}` });

const schemaMap = {
    portfolio: [
        { name: 'title', type: 'text', label: 'Title' },
        { name: 'category', type: 'text', label: 'Category (web / mobile / ai)' },
        { name: 'description', type: 'textarea', label: 'Description' },
        { name: 'link', type: 'text', label: 'Project Link' }
    ],
    services: [
        { name: 'title', type: 'text', label: 'Title' },
        { name: 'description', type: 'textarea', label: 'Description' },
        { name: 'icon', type: 'text', label: 'Icon Class (e.g. ri-code-s-slash-line)' },
        { name: 'features', type: 'text', label: 'Features (comma separated)' }
    ],
    blogs: [
        { name: 'title', type: 'text', label: 'Title' },
        { name: 'content', type: 'textarea', label: 'Content (HTML supported)' },
        { name: 'excerpt', type: 'textarea', label: 'Excerpt (short summary)' },
        { name: 'author', type: 'text', label: 'Author' },
        { name: 'category', type: 'text', label: 'Category (tech / career / community)' }
    ],
    leads: ['status'],
    bookings: ['status']
};

async function fetchData() {
    const thead = document.getElementById('table-head');
    if (currentSection === 'leads' || currentSection === 'bookings') {
        thead.innerHTML = `<th>Name</th><th>Email</th><th>Status</th><th>Actions</th>`;
        document.querySelector('.btn-add').style.display = 'none';
    } else {
        thead.innerHTML = `<th>Image</th><th>Title</th><th>Actions</th>`;
        document.querySelector('.btn-add').style.display = 'inline-block';
    }

    const res = await fetch(`${API_BASE}/${currentSection}`, { headers: getHeaders() });
    if (res.status === 401) logout();

    const data = await res.json();
    renderTable(data);
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
}

function renderTable(data) {
    const body = document.getElementById('table-body');
    if (currentSection === 'leads' || currentSection === 'bookings') {
        body.innerHTML = data.map(item => `
                    <tr>
                        <td>${item.title || item.firstName}</td>
                        <td>${item.email}</td>
                        <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                        <td>
                            <button class="btn" style="background: #21262d; color: white;" onclick="editItem('${item._id}')">Edit</button>
                            <button class="btn btn-delete" onclick="deleteItem('${item._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
    } else {
        body.innerHTML = data.map(item => `
                    <tr>
                        <td>${item.image ? `<img src="${item.image}" class="thumb-img" alt="thumb">` : '—'}</td>
                        <td>${item.title}</td>
                        <td>
                            <button class="btn" style="background: #21262d; color: white;" onclick="editItem('${item._id}')">Edit</button>
                            <button class="btn btn-delete" onclick="deleteItem('${item._id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
    }
}

function loadSection(section) {
    currentSection = section;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById('section-title').innerText = section.charAt(0).toUpperCase() + section.slice(1) + " Management";
    fetchData();
}

function openModal() {
    editingId = null;
    currentImageUrl = '';
    document.getElementById('modal-title').innerText = `Add to ${currentSection}`;
    buildModalFields({});
    document.getElementById('modal').style.display = 'flex';
}

async function editItem(id) {
    editingId = id;
    const res = await fetch(`${API_BASE}/${currentSection}`, { headers: getHeaders() });
    const items = await res.json();
    const item = items.find(i => i._id === id);
    currentImageUrl = item.image || '';

    document.getElementById('modal-title').innerText = `Edit ${currentSection}`;
    buildModalFields(item);
    document.getElementById('modal').style.display = 'flex';
}

function buildModalFields(item) {
    const fieldsContainer = document.getElementById('modal-fields');
    if (currentSection === 'leads' || currentSection === 'bookings') {
        fieldsContainer.innerHTML = schemaMap[currentSection].map(field => `
                    <div class="form-group">
                        <label>${field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input type="text" id="field-${field}" value="${item[field] || ''}">
                    </div>
                `).join('');
        return;
    }

    // Portfolio or Services with file upload
    const fields = schemaMap[currentSection];
    let html = fields.map(field => {
        const val = item[field.name] || '';
        if (field.type === 'textarea') {
            return `
                        <div class="form-group">
                            <label>${field.label}</label>
                            <textarea id="field-${field.name}" rows="3">${val}</textarea>
                        </div>
                    `;
        }
        return `
                    <div class="form-group">
                        <label>${field.label}</label>
                        <input type="${field.type}" id="field-${field.name}" value="${val}">
                    </div>
                `;
    }).join('');

    // Image upload field
    html += `
                <div class="form-group">
                    <label>Image</label>
                    <input type="file" id="field-image" accept="image/*">
                    ${currentImageUrl ? `<img src="${currentImageUrl}" class="image-preview" id="current-image-preview" alt="Current">` : ''}
                </div>
            `;

    fieldsContainer.innerHTML = html;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    editingId = null;
    currentImageUrl = '';
}

async function saveItem() {
    const isFileSection = currentSection === 'portfolio' || currentSection === 'services' || currentSection === 'blogs';

    if (isFileSection) {
        const formData = new FormData();
        const fields = schemaMap[currentSection];
        fields.forEach(field => {
            const el = document.getElementById(`field-${field.name}`);
            if (el) formData.append(field.name, el.value);
        });

        const fileInput = document.getElementById('field-image');
        if (fileInput && fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        } else if (currentImageUrl) {
            formData.append('image', currentImageUrl);
        }

        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${API_BASE}/${currentSection}/${editingId}` : `${API_BASE}/${currentSection}`;

        await fetch(url, {
            method: method,
            headers: getHeaders(), // Content-Type omitted so browser sets multipart boundary
            body: formData
        });
    } else {
        const payload = {};
        schemaMap[currentSection].forEach(field => {
            payload[field] = document.getElementById(`field-${field}`).value;
        });

        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${API_BASE}/${currentSection}/${editingId}` : `${API_BASE}/${currentSection}`;

        await fetch(url, {
            method: method,
            headers: { ...getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }

    closeModal();
    fetchData();
}

async function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        await fetch(`${API_BASE}/${currentSection}/${id}`, { method: 'DELETE', headers: getHeaders() });
        fetchData();
    }
}

window.onload = fetchData;