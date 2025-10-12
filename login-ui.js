// login-ui.js - UI boshqarish va interfeys

class LoginUI {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.showUserInfo();
    }

    // Eventlarni bog'lash
    bindEvents() {
        // Form submit
        const loginForm = document.querySelector('.login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                this.handleLogin(e);
            });
        }

        // User type selection
        document.querySelectorAll('.user-option').forEach((option, index) => {
            option.addEventListener('click', () => {
                const type = index === 0 ? 'manager' : 'staff';
                authManager.selectUserType(type);
            });
        });

        // Input focus/blur effektlari
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
        });

        // Enter bosganda login
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin(e);
            }
        });
    }

    // Login jarayoni
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validatsiya
        if (!this.validateInputs(username, password)) {
            return;
        }

        // Loading holatini ko'rsatish
        this.showLoading(true);

        try {
            const result = await authManager.login(username, password);
            
            if (result.success) {
                this.showSuccess('Muvaffaqiyatli kirildi! Yo‘naltirilmoqda...');
                
                // 1.5 soniyadan keyin redirect
                setTimeout(() => {
                    window.location.href = result.redirectUrl;
                }, 1500);
                
            } else {
                this.showError(result.error);
                this.shakeForm();
            }
        } catch (error) {
            this.showError('Tizimda xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.');
            console.error('Login error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    // Inputlarni validatsiya qilish
    validateInputs(username, password) {
        if (!username) {
            this.showError('Iltimos, foydalanuvchi nomini kiriting.');
            document.getElementById('username').focus();
            return false;
        }

        if (!password) {
            this.showError('Iltimos, parolni kiriting.');
            document.getElementById('password').focus();
            return false;
        }

        if (password.length < 4) {
            this.showError('Parol kamida 4 ta belgidan iborat bo‘lishi kerak.');
            document.getElementById('password').focus();
            return false;
        }

        return true;
    }

    // Xabarlarni ko'rsatish
    showMessage(message, type = 'error') {
        const alert = document.getElementById('alert');
        if (!alert) return;
        
        alert.textContent = message;
        alert.className = `alert alert-${type}`;
        alert.style.display = 'block';

        // Avtomatik yashirish
        if (type === 'success') {
            setTimeout(() => {
                alert.style.display = 'none';
            }, 3000);
        }
    }

    // Error xabarini ko'rsatish
    showError(message) {
        this.showMessage(message, 'error');
    }

    // Success xabarini ko'rsatish
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // Loading holatini ko'rsatish
    showLoading(show) {
        const button = document.querySelector('.btn-primary');
        if (!button) return;
        
        const originalText = button.querySelector('.btn-text')?.textContent || 'Kirish';
        
        if (show) {
            button.innerHTML = '<div class="spinner"></div> Kirish...';
            button.disabled = true;
        } else {
            button.innerHTML = `<span class="btn-text">${originalText}</span>`;
            button.disabled = false;
        }
    }

    // Formni tebratish (error paytida)
    shakeForm() {
        const form = document.querySelector('.login-form');
        if (form) {
            form.style.animation = 'shake 0.5s';
            setTimeout(() => {
                form.style.animation = '';
            }, 500);
        }
    }

    // Foydalanuvchi ma'lumotlarini ko'rsatish
    showUserInfo() {
        // Agar sessiya mavjud bo'lsa, ma'lumotlarni ko'rsatish
        if (authManager.isSessionValid()) {
            const user = authManager.getCurrentUser();
            console.log('Current user:', user);
        }
    }

    // Parolni ko'rsatish/yashirish
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
        }
    }
}

// CSS animatsiyalari
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .alert-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .form-group.focused label {
        color: #667eea;
        transform: translateY(-5px);
        font-size: 12px;
    }
    
    .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
        margin-right: 8px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .password-toggle {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
    }
    
    .password-container {
        position: relative;
    }
`;
document.head.appendChild(style);

// DOM ready bo'lganda ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
    window.loginUI = new LoginUI();
});