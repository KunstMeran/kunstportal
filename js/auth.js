/**
 * PROJEKTSOFTWARE KUNST MERAN - AUTH MODULE
 * Login/Logout Funktionalität
 * Version: 1.0.0
 */

const Auth = {
    /**
     * Login-Formular verarbeiten
     */
    handleLogin: function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');

        // Validierung
        const user = DataManager.validateLogin(username, password);

        if (user) {
            // Session erstellen
            DataManager.setSession(user);
            // Weiterleitung zur App
            window.location.href = 'app.html';
        } else {
            // Fehlermeldung anzeigen
            errorElement.textContent = 'Ungültiger Benutzername oder Passwort';
            errorElement.classList.add('show');

            // Passwortfeld leeren
            document.getElementById('password').value = '';
        }
    },

    /**
     * Logout durchführen
     */
    logout: function() {
        DataManager.clearSession();
        window.location.href = 'index.html';
    },

    /**
     * Prüft ob Benutzer eingeloggt ist
     * Leitet zur Login-Seite um wenn nicht
     */
    checkAuth: function() {
        if (!DataManager.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    /**
     * Prüft ob bereits eingeloggt (für Login-Seite)
     * Leitet zur App um wenn bereits eingeloggt
     */
    checkAlreadyLoggedIn: function() {
        if (DataManager.isLoggedIn()) {
            window.location.href = 'app.html';
            return true;
        }
        return false;
    },

    /**
     * Aktuelle Benutzerinfo laden
     */
    getCurrentUser: function() {
        return DataManager.getSession();
    },

    /**
     * Prüft Admin-Rechte
     */
    isAdmin: function() {
        return DataManager.isAdmin();
    }
};
