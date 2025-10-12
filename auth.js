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
        this.selectedUserType = 'manager';
        this.init();
    }

    init() {
        this.checkExistingSession();
        this.selectUserType('manager');
    }

    selectUserType(type) {
        this.selectedUserType = type;
        
        document.querySelectorAll('.user-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.querySelector(`.user-option:nth-child(${type === 'manager' ? 1 : 2})`).classList.add('selected');
        
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            if (type === 'manager') {
                usernameInput.placeholder = "Mudir loginingizni kiriting";
            } else {
                usernameInput.placeholder = "Xodim loginingizni kiriting";
            }
        }
    }

    async login(username, password) {
        const credentials = this.userCredentials[this.selectedUserType];
        
        if (username === credentials.username && password === credentials.password) {
            this.currentUser = {
                type: this.selectedUserType,
                username: username,
                role: credentials.role,
                displayName: credentials.displayName,
                appScriptUrl: credentials.appScriptUrl,
                loginTime: new Date()
            };
            
            this.saveSession();
            
            return {
                success: true,
                redirectUrl: 'app.html',
                user: this.currentUser
            };
        } else {
            return {
                success: false,
                error: 'Noto‘g‘ri login yoki parol!'
            };
        }
    }

    saveSession() {
        const sessionData = {
            user: this.currentUser,
            timestamp: Date.now()
        };
        
        localStorage.setItem('oshxona_session', JSON.stringify(sessionData));
        sessionStorage.setItem('oshxona_session', JSON.stringify(sessionData));
    }

    checkExistingSession() {
        const sessionData = localStorage.getItem('oshxona_session') || sessionStorage.getItem('oshxona_session');
        
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                const sessionAge = Date.now() - parsed.timestamp;
                const maxAge = 24 * 60 * 60 * 1000;
                
                if (sessionAge < maxAge) {
                    this.currentUser = parsed.user;
                    return true;
                } else {
                    this.logout();
                }
            } catch (e) {
                console.error('Session parse error:', e);
                this.logout();
            }
        }
        return false;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getAppScriptUrl() {
        return this.currentUser?.appScriptUrl || null;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('oshxona_session');
        sessionStorage.removeItem('oshxona_session');
        window.location.href = 'index.html';
    }

    isSessionValid() {
        return this.currentUser !== null;
    }

    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        const roleHierarchy = {
            'staff': 1,
            'manager': 2
        };
        
        return roleHierarchy[this.currentUser.role] >= roleHierarchy[requiredRole];
    }
}

window.authManager = new AuthManager();