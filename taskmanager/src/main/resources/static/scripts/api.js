// API base configuration and helper functions
const API_BASE_URL = 'https://taskmanager-api-vr4t.onrender.com/api';


class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    getToken() {
        return localStorage.getItem('jwt_token');
    }

    setToken(token) {
        localStorage.setItem('jwt_token', token);
    }

    removeToken() {
        localStorage.removeItem('jwt_token');
    }

    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch (error) {
            return false;
        }
    }

    getUserInfo() {
        const user = localStorage.getItem("user_info");
        return user ? JSON.parse(user) : null;
    }


    isAdmin() {
        const userInfo = this.getUserInfo();
        return userInfo && userInfo.roles.includes('ADMIN');
    }

    getAuthHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                this.removeToken();
                window.location.href = '/login.html';
                throw new Error('Unauthorized access. Please login again.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// ✅ Make it globally accessible
const apiClient = new ApiClient();

// Global UI helpers
function showMessage(message, type = 'info') {
    let messageElement = document.getElementById('message-container');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'message-container';
        messageElement.className = 'message-container';
        document.body.insertBefore(messageElement, document.body.firstChild);
    }

    const alertClass = type === 'error' ? 'alert-danger' :
        type === 'success' ? 'alert-success' : 'alert-info';

    messageElement.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    setTimeout(() => {
        const alert = messageElement.querySelector('.alert');
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => {
                messageElement.innerHTML = '';
            }, 150);
        }
    }, 5000);
}

function showLoading(show = true) {
    let loadingElement = document.getElementById('loading-container');
    if (show) {
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading-container';
            loadingElement.className = 'loading-container';
            loadingElement.innerHTML = `
                <div class="d-flex justify-content-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(loadingElement);
        }
        loadingElement.style.display = 'block';
    } else {
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

function redirectTo(page) {
    window.location.href = page;
}

function checkAuth() {
    if (!apiClient.isAuthenticated()) {
        const publicPages = ['/', '/index.html', '/login.html', '/register.html'];
        const currentPath = window.location.pathname;

        if (!publicPages.includes(currentPath)) {
            redirectTo('/login.html');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const protectedPages = ['/dashboard.html', '/admin.html'];
    const currentPath = window.location.pathname;

    if (protectedPages.includes(currentPath)) {
        checkAuth();
    }
});
