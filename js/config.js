/**
 * Configuration File
 * Environment-abhängige Konfiguration
 */

const Config = {
    // Supabase Konfiguration
    supabase: {
        // Diese Werte werden von Vercel Environment Variables überschrieben
        url: typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL
            ? process.env.VITE_SUPABASE_URL
            : 'YOUR_SUPABASE_URL',
        anonKey: typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY
            ? process.env.VITE_SUPABASE_ANON_KEY
            : 'YOUR_SUPABASE_ANON_KEY'
    },

    // App Konfiguration
    app: {
        name: 'Projektsoftware Kunst Meran',
        version: '2.0.0',
        environment: typeof process !== 'undefined' && process.env && process.env.NODE_ENV
            ? process.env.NODE_ENV
            : 'production'
    },

    // Feature Flags
    features: {
        useSupabase: true, // Auf false setzen für lokalen localStorage-Modus
        enableRealtime: true, // Realtime-Subscriptions aktivieren
        enableBackups: true
    }
};

// Export für andere Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}
