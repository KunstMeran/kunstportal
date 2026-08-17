/**
 * Configuration File
 * Environment-abhängige Konfiguration
 *
 * WICHTIG: Ersetze SUPABASE_URL_PLACEHOLDER und SUPABASE_KEY_PLACEHOLDER
 * mit deinen echten Werten vor dem Deployment!
 */

const Config = {
    // Supabase Konfiguration
    supabase: {
        url: 'https://adhzwaxzozujmaeexyej.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkaHp3YXh6b3p1am1hZWV4eWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NDIyNDQsImV4cCI6MjA5OTIxODI0NH0.u8Or_AdeNHVMoAlj98h7aykau2QQhFyjsP4PImDCYDg'
    },

    // App Konfiguration
    app: {
        name: 'Projektsoftware Kunst Meran',
        version: '2.0.0',
        environment: 'production'
    },

    // Feature Flags
    features: {
        useSupabase: true, // Auf false setzen für lokalen localStorage-Modus
        enableRealtime: false, // Erstmal deaktiviert
        enableBackups: true
    },

    // Microsoft SSO Konfiguration (aktivieren nach Hetzner-Migration)
    microsoftSSO: {
        enabled: false,
        allowedDomain: 'kunstmeranoarte.org', // Nur diese Domain darf sich mit Microsoft anmelden
        providerName: 'azure' // Supabase Provider-Name für Azure AD
    }
};

// Export für andere Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
