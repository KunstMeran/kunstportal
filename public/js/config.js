/**
 * Configuration File
 * Environment-abhängige Konfiguration
 *
 * Version: 3.0.0 - Hetzner Migration
 */

const Config = {
    // API Konfiguration (Hetzner Server)
    api: {
        baseUrl: 'https://portal.kunstmeranoarte.org/api/v1',
        timeout: 30000
    },

    // Storage Konfiguration
    storage: {
        baseUrl: 'https://portal.kunstmeranoarte.org/storage'
    },

    // Legacy: Supabase Konfiguration (nicht mehr verwendet)
    supabase: {
        url: null,
        anonKey: null
    },

    // App Konfiguration
    app: {
        name: 'Projektsoftware Kunst Meran',
        version: '3.0.0',
        environment: 'production'
    },

    // Feature Flags
    features: {
        useSupabase: false, // Deaktiviert - nutze eigene API
        useHetznerAPI: true, // Neue Hetzner API
        enableRealtime: false,
        enableBackups: true
    },

    // Microsoft SSO Konfiguration
    microsoftSSO: {
        enabled: true,
        clientId: 'PLACEHOLDER_CLIENT_ID', // Von Ruben
        tenantId: 'PLACEHOLDER_TENANT_ID', // Von Ruben
        redirectUri: 'https://portal.kunstmeranoarte.org/callback'
    }
};

// Export für andere Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
