// auth.js - Autentifikatsiya va sessiya boshqarish

class AuthManager {
    constructor() {
        this.userCredentials = {
            manager: {
                username: 'manager',
                password: 'manager123',
                appScriptUrl: 'https://script.google.com/macros/s/AKfycbw4yUYHuUy9RVmD9G92nu9Ky3-ZcYiTNlvXbNSjC511HQoRLB4gpYvb6caG_8RFbmT5Wg/exec',
                role: 'manager',
                displayName: 'Xo\'jalik Mudiri'
            },
            staff: {
                username: 'staff', 
                password: 'staff123',
                appScriptUrl: 'https://script.google.com/macros/s/AKfycby2HTCDvY5JLoM_Y2CyxNpzClujaWl573AzaXWJ9J3Kv2ydmRxWeDghhvz8rLEObNwGBg/exec',
                role: 'staff',
                displayName: 'Oshxona Xodimi'
            }
        };
        
        this.currentUser = null;
        this.selectedUserType = 'manager'; // Default
        this.init();
    }

    init() {
        // Sessiyani tekshirish
        this.checkExistingSession();
        // Default user type tanlash
        this.selectUserType('manager');
    }

    // Foydalanuvchi turini tanlash
    selectUserType(type) {
        this.selectedUserType = type;
        
        // UI ni yangilash
        document.querySelectorAll('.user-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.querySelector(`.user-option:nth-child(${type === 'manager' ? 1 : 2})`).classList.add('selected');
        
        // Placeholder ni yangilash
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            if (type === 'manager') {
                usernameInput.placeholder = "Mudir loginingizni kiriting";
            } else {
                usernameInput.placeholder = "Xodim loginingizni kiriting";
            }
        }
    }

    // Login qilish
    async login(username, password) {
        const credentials = this.userCredentials[this.selectedUserType];
        
        if (username === credentials.username && password === credentials.password) {
            // Muvaffaqiyatli login
            this.currentUser = {
                type: this.selectedUserType,
                username: username,
                role: credentials.role,
                displayName: credentials.displayName,
                appScriptUrl: credentials.appScriptUrl, // App Script URL ni saqlaymiz
                loginTime: new Date()
            };
            
            // Sessiyani saqlash
            this.saveSession();
            
            // app.html ga yo'naltirish
            return {
                success: true,
                redirectUrl: 'app.html',
                user: this.currentUser
            };
        } else {
            // Login muvaffaqiyatsiz
            return {
                success: false,
                error: 'Noto‘g‘ri login yoki parol!'
            };
        }
    }

    // Sessiyani saqlash
    saveSession() {
        const sessionData = {
            user: this.currentUser,
            timestamp: Date.now()
        };
        
        localStorage.setItem('oshxona_session', JSON.stringify(sessionData));
        sessionStorage.setItem('oshxona_session', JSON.stringify(sessionData));
    }

    // Mavjud sessiyani tekshirish
    checkExistingSession() {
        const sessionData = localStorage.getItem('oshxona_session') || sessionStorage.getItem('oshxona_session');
        
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                const sessionAge = Date.now() - parsed.timestamp;
                const maxAge = 24 * 60 * 60 * 1000; // 24 soat
                
                if (sessionAge < maxAge) {
                    this.currentUser = parsed.user;
                    return true;
                } else {
                    // Sessiya muddati tugagan
                    this.logout();
                }
            } catch (e) {
                console.error('Session parse error:', e);
                this.logout();
            }
        }
        return false;
    }

    // Foydalanuvchi ma'lumotlarini olish
    getCurrentUser() {
        return this.currentUser;
    }

    // App Script URL ni olish
    getAppScriptUrl() {
        return this.currentUser?.appScriptUrl || null;
    }

    // Logout qilish
    logout() {
        this.currentUser = null;
        localStorage.removeItem('oshxona_session');
        sessionStorage.removeItem('oshxona_session');
        
        // Login sahifasiga qaytish
        window.location.href = 'index.html';
    }

    // Sessiya muddatini tekshirish
    isSessionValid() {
        return this.currentUser !== null;
    }

    // Foydalanuvchi huquqlarini tekshirish
    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        const roleHierarchy = {
            'staff': 1,
            'manager': 2
        };
        
        return roleHierarchy[this.currentUser.role] >= roleHierarchy[requiredRole];
    }
}

// Global auth instance
window.authManager = new AuthManager();