// app-manager.js - Asosiy ilovani boshqarish

class AppManager {
    constructor() {
        this.init();
    }

    init() {
        if (!this.checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.showUserInfo();
        this.initializeApp();
        this.setupHistoryManagement();
    }

    checkAuth() {
        const sessionData = localStorage.getItem('oshxona_session') || 
                           sessionStorage.getItem('oshxona_session');
        
        if (!sessionData) {
            return false;
        }

        try {
            const parsed = JSON.parse(sessionData);
            const sessionAge = Date.now() - parsed.timestamp;
            const maxAge = 24 * 60 * 60 * 1000;

            if (sessionAge < maxAge) {
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (e) {
            console.error('Session parse error:', e);
            this.logout();
            return false;
        }
    }

    showUserInfo() {
        const sessionData = localStorage.getItem('oshxona_session') || 
                           sessionStorage.getItem('oshxona_session');
        
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                const user = parsed.user;
                
                const welcomeElement = document.getElementById('userWelcome');
                if (welcomeElement) {
                    welcomeElement.textContent = `Xush kelibsiz, ${user.displayName}!`;
                }
            } catch (e) {
                console.error('User info error:', e);
            }
        }
    }

    initializeApp() {
        console.log('Maktab Oshxona Tizimi ishga tushirildi');
        
        if (window.appScripts) {
            window.appScripts.init();
        }
    }

    logout() {
        localStorage.removeItem('oshxona_session');
        sessionStorage.removeItem('oshxona_session');
        window.location.href = 'index.html';
    }

    refreshSession() {
        const sessionData = localStorage.getItem('oshxona_session') || 
                           sessionStorage.getItem('oshxona_session');
        
        if (sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                parsed.timestamp = Date.now();
                
                localStorage.setItem('oshxona_session', JSON.stringify(parsed));
                sessionStorage.setItem('oshxona_session', JSON.stringify(parsed));
            } catch (e) {
                console.error('Session refresh error:', e);
            }
        }
    }

    setupHistoryManagement() {
        window.history.pushState(null, null, window.location.href);
        
        window.addEventListener('popstate', (e) => {
            window.history.pushState(null, null, window.location.href);
            this.showSessionWarning();
        });

        window.addEventListener('beforeunload', (e) => {
            if (!this.checkAuth()) {
                e.preventDefault();
                e.returnValue = 'Sizning sessiyangiz tugadi. Iltimos, qaytadan kiring.';
            }
        });
    }

    showSessionWarning() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
        `;
        warning.innerHTML = `
            <strong>⚠️ Diqqat!</strong>
            <p>Siz tizimdan chiqib ketishingiz mumkin. Sahifani yangilamang.</p>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 3000);
    }
}

window.appManager = new AppManager();

setInterval(() => {
    if (window.appManager) {
        window.appManager.refreshSession();
    }
}, 30 * 60 * 1000);