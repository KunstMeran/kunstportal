/**
 * PROJEKTSOFTWARE KUNST MERAN - AUTH MODULE
 * Login/Logout Funktionalität mit Supabase
 * Version: 2.0.0
 */

const Auth = {
    /**
     * Login-Formular verarbeiten
     */
    handleLogin: async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');

        // Supabase nutzen falls aktiviert
        if (Config.features.useSupabase) {
            try {
                // Supabase erwartet E-Mail, nicht Username
                // Username als E-Mail formatieren (falls noch nicht)
                const email = username.includes('@') ? username : `${username}@kunstmeran.local`;

                const { data, error } = await SupabaseService.signIn(email, password);

                if (error) throw error;

                // Session erstellen
                DataManager.setSession({
                    id: data.user.id,
                    email: data.user.email,
                    username: data.user.email.split('@')[0],
                    role: 'Admin' // TODO: Von user_metadata oder users-Tabelle laden
                });

                // Weiterleitung zur App
                window.location.href = 'app.html';
            } catch (error) {
                console.error('Login Error:', error);
                errorElement.textContent = 'Ungültiger Benutzername oder Passwort';
                errorElement.classList.add('show');
                document.getElementById('password').value = '';
            }
        } else {
            // Fallback: localStorage-basierte Auth
            const user = DataManager.validateLogin(username, password);

            if (user) {
                DataManager.setSession(user);
                window.location.href = 'app.html';
            } else {
                errorElement.textContent = 'Ungültiger Benutzername oder Passwort';
                errorElement.classList.add('show');
                document.getElementById('password').value = '';
            }
        }
    },

    /**
     * Logout durchführen
     */
    logout: async function() {
        if (Config.features.useSupabase) {
            try {
                await SupabaseService.signOut();
            } catch (error) {
                console.error('Logout Error:', error);
            }
        }
        DataManager.clearSession();
        window.location.href = 'index.html';
    },

    /**
     * Prüft ob Benutzer eingeloggt ist
     * Leitet zur Login-Seite um wenn nicht
     */
    checkAuth: async function() {
        if (Config.features.useSupabase) {
            try {
                const session = await SupabaseService.getSession();
                if (!session) {
                    window.location.href = 'index.html';
                    return false;
                }
                return true;
            } catch (error) {
                console.error('Auth Check Error:', error);
                window.location.href = 'index.html';
                return false;
            }
        } else {
            if (!DataManager.isLoggedIn()) {
                window.location.href = 'index.html';
                return false;
            }
            return true;
        }
    },

    /**
     * Prüft ob bereits eingeloggt (für Login-Seite)
     * Leitet zur App um wenn bereits eingeloggt
     */
    checkAlreadyLoggedIn: async function() {
        if (Config.features.useSupabase) {
            try {
                const session = await SupabaseService.getSession();
                if (session) {
                    window.location.href = 'app.html';
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Session Check Error:', error);
                return false;
            }
        } else {
            if (DataManager.isLoggedIn()) {
                window.location.href = 'app.html';
                return true;
            }
            return false;
        }
    },

    /**
     * Aktuelle Benutzerinfo laden
     */
    getCurrentUser: async function() {
        if (Config.features.useSupabase) {
            try {
                const user = await SupabaseService.getCurrentUser();
                return {
                    id: user.id,
                    email: user.email,
                    username: user.email.split('@')[0],
                    role: 'Admin' // TODO: Von Datenbank laden
                };
            } catch (error) {
                console.error('Get User Error:', error);
                return null;
            }
        } else {
            return DataManager.getSession();
        }
    },

    /**
     * Prüft Admin-Rechte
     */
    isAdmin: function() {
        return DataManager.isAdmin();
    }
};
