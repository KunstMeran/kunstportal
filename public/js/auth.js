/**
 * PROJEKTSOFTWARE KUNST MERAN - AUTH MODULE
 * Microsoft SSO Authentifizierung mit MSAL
 * Version: 3.0.0 - Hetzner Migration
 */

const Auth = {
    msalInstance: null,

    /**
     * MSAL initialisieren
     */
    init() {
        if (!Config.microsoftSSO.enabled) {
            console.log('Microsoft SSO deaktiviert');
            return;
        }

        // Prüfen ob Client ID konfiguriert ist
        if (Config.microsoftSSO.clientId === 'PLACEHOLDER_CLIENT_ID') {
            console.warn('Microsoft SSO: Client ID noch nicht konfiguriert');
            return;
        }

        const msalConfig = {
            auth: {
                clientId: Config.microsoftSSO.clientId,
                authority: `https://login.microsoftonline.com/${Config.microsoftSSO.tenantId}`,
                redirectUri: Config.microsoftSSO.redirectUri,
            },
            cache: {
                cacheLocation: 'sessionStorage',
                storeAuthStateInCookie: false,
            },
        };

        this.msalInstance = new msal.PublicClientApplication(msalConfig);
        console.log('🔐 MSAL initialisiert');
    },

    /**
     * Microsoft Login starten
     */
    handleMicrosoftLogin: async function() {
        if (!this.msalInstance) {
            this.init();
        }

        if (!this.msalInstance) {
            console.error('MSAL nicht verfügbar');
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                errorElement.textContent = 'Microsoft-Anmeldung ist nicht konfiguriert. Bitte kontaktiere den Administrator.';
                errorElement.classList.add('show');
            }
            return;
        }

        try {
            const loginRequest = {
                scopes: ['openid', 'profile', 'email'],
            };

            // Popup-Login für bessere UX
            const response = await this.msalInstance.loginPopup(loginRequest);
            console.log('Microsoft Login erfolgreich:', response.account.username);

            // Token an Backend senden für Session
            await this.createBackendSession(response);

        } catch (error) {
            console.error('Microsoft Login Error:', error);
            const errorElement = document.getElementById('login-error');
            if (errorElement) {
                if (error.errorCode === 'user_cancelled') {
                    errorElement.textContent = 'Anmeldung abgebrochen';
                } else {
                    errorElement.textContent = error.message || 'Microsoft-Anmeldung fehlgeschlagen';
                }
                errorElement.classList.add('show');
            }
        }
    },

    /**
     * Backend-Session erstellen nach Microsoft Login
     */
    createBackendSession: async function(msalResponse) {
        try {
            const account = msalResponse.account;

            // Login an Backend senden
            const result = await ApiClient.login(
                account.username, // E-Mail
                account.name,
                account.localAccountId // Microsoft ID
            );

            if (result.success) {
                // Session lokal speichern
                DataManager.setSession({
                    id: result.user.id,
                    email: result.user.email,
                    username: result.user.name || result.user.email.split('@')[0],
                    role: result.user.user_type,
                    permissions: result.user.permissions
                });

                // Weiterleitung zur App
                window.location.href = 'app.html';
            } else {
                throw new Error('Backend-Session konnte nicht erstellt werden');
            }

        } catch (error) {
            console.error('Backend Session Error:', error);
            throw error;
        }
    },

    /**
     * Logout durchführen
     */
    logout: async function() {
        try {
            // Backend-Session beenden
            await ApiClient.logout();
        } catch (error) {
            console.error('Backend Logout Error:', error);
        }

        // MSAL Logout (optional - räumt nur den lokalen Cache auf)
        if (this.msalInstance) {
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                this.msalInstance.clearCache();
            }
        }

        // Lokale Session löschen
        DataManager.clearSession();
        window.location.href = 'index.html';
    },

    /**
     * Prüft ob Benutzer eingeloggt ist
     */
    checkAuth: async function() {
        try {
            const session = await ApiClient.getSession();
            if (!session) {
                window.location.href = 'index.html';
                return false;
            }

            // Session lokal speichern für schnellen Zugriff
            DataManager.setSession({
                id: session.id,
                email: session.email,
                username: session.name || session.email.split('@')[0],
                role: session.user_type,
                permissions: session.permissions
            });

            return true;
        } catch (error) {
            console.error('Auth Check Error:', error);
            window.location.href = 'index.html';
            return false;
        }
    },

    /**
     * Prüft ob bereits eingeloggt (für Login-Seite)
     */
    checkAlreadyLoggedIn: async function() {
        try {
            const session = await ApiClient.getSession();
            if (session) {
                window.location.href = 'app.html';
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    },

    /**
     * Aktuelle Benutzerinfo laden
     */
    getCurrentUser: async function() {
        try {
            const session = await ApiClient.getSession();
            if (session) {
                return {
                    id: session.id,
                    email: session.email,
                    username: session.name || session.email.split('@')[0],
                    role: session.user_type,
                    permissions: session.permissions
                };
            }
            return null;
        } catch (error) {
            console.error('Get User Error:', error);
            return null;
        }
    },

    /**
     * Aktuelle Benutzer-ID (synchron aus lokaler Session)
     */
    getCurrentUserId: function() {
        try {
            const session = DataManager.getSession();
            return session?.id || null;
        } catch (error) {
            console.error('Get User ID Error:', error);
            return null;
        }
    },

    /**
     * Prüft Admin-Rechte
     */
    isAdmin: function() {
        return DataManager.isAdmin();
    },

    /**
     * Legacy: Login-Formular Handler
     */
    handleLogin: async function(event) {
        event.preventDefault();
        // Immer Microsoft SSO verwenden
        await Auth.handleMicrosoftLogin();
    }
};

// MSAL initialisieren wenn Config geladen
if (typeof Config !== 'undefined' && Config.microsoftSSO && Config.microsoftSSO.enabled) {
    Auth.init();
}

console.log('🔐 Auth Module geladen (MSAL)');
