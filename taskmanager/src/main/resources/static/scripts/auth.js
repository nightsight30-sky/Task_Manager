// Authentication functionality
class AuthManager {
    constructor() {
        this.apiClient = apiClient;
    }

    // Register new user
    async register(userData) {
        try {
            showLoading(true);
            const response = await this.apiClient.post('/auth/register', userData);
            showMessage('Registration successful! Please login.', 'success');
            return response;
        } catch (error) {
            showMessage(error.message || 'Registration failed. Please try again.', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Login user
    async login(credentials) {
        try {
            showLoading(true);
            const response = await this.apiClient.post('/auth/login', credentials);

            if (response.token) {
                this.apiClient.setToken(response.token);

                // ✅ Decode JWT token payload
                const payload = JSON.parse(atob(response.token.split('.')[1]));

                // ✅ Store decoded user info in localStorage
                localStorage.setItem("user_info", JSON.stringify({
                    id: payload.id,               // Make sure 'id' is present in JWT!
                    username: payload.sub,
                    email: payload.email || "",   // Optional
                    roles: payload.roles || []
                }));

                showMessage('Login successful!', 'success');

                setTimeout(() => {
                    if (this.apiClient.isAdmin()) {
                        redirectTo('/admin.html');
                    } else {
                        redirectTo('/dashboard.html');
                    }
                }, 1000);
            }

            return response;
        } catch (error) {
            showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }

    // Logout user
    logout() {
        this.apiClient.removeToken();
        showMessage('Logged out successfully!', 'success');
        setTimeout(() => {
            redirectTo('/index.html');
        }, 1000);
    }

    // Get current user info
    getCurrentUser() {
        return this.apiClient.getUserInfo();
    }
}

// Global auth manager instance
const authManager = new AuthManager();

// Form handlers
function handleRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        // Basic validation
        if (!userData.username || !userData.email || !userData.password) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        if (userData.password.length < 6) {
            showMessage('Password must be at least 6 characters long.', 'error');
            return;
        }

        try {
            await authManager.register(userData);
            // Redirect to login after successful registration
            setTimeout(() => {
                redirectTo('/login.html');
            }, 2000);
        } catch (error) {
            // Error already handled in register method
        }
    });
}

function handleLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        // Basic validation
        if (!credentials.username || !credentials.password) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        try {
            await authManager.login(credentials);
        } catch (error) {
            // Error already handled in login method
        }
    });
}

// Logout handler
function handleLogout() {
    const logoutButtons = document.querySelectorAll('[data-action="logout"]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.logout();
        });
    });
}

// Initialize auth handlers on DOM load
document.addEventListener('DOMContentLoaded', () => {
    handleRegisterForm();
    handleLoginForm();
    handleLogout();
    
    // Display current user info if logged in
    const userInfo = authManager.getCurrentUser();
    if (userInfo) {
        const userElements = document.querySelectorAll('.current-user');
        userElements.forEach(element => {
            element.textContent = userInfo.username;
        });
    }
});
