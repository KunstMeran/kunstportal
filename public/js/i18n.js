/**
 * Internationalization (i18n) System for Kunsthaus Meran Portal
 * Supports: German (de), English (en), Italian (it)
 */
const I18n = {
    currentLocale: 'de',
    translations: {},
    supportedLocales: ['de', 'en', 'it'],

    /**
     * Initialize i18n system
     * Loads language from localStorage or browser settings
     */
    init() {
        // Load translations
        this.translations = {
            de: typeof translations_de !== 'undefined' ? translations_de : {},
            en: typeof translations_en !== 'undefined' ? translations_en : {},
            it: typeof translations_it !== 'undefined' ? translations_it : {}
        };

        // Get saved locale or detect from browser
        const savedLocale = localStorage.getItem('locale');
        const browserLocale = navigator.language.split('-')[0];

        if (savedLocale && this.supportedLocales.includes(savedLocale)) {
            this.currentLocale = savedLocale;
        } else if (this.supportedLocales.includes(browserLocale)) {
            this.currentLocale = browserLocale;
        } else {
            this.currentLocale = 'de'; // Default fallback
        }

        this.applyTranslations();
        this.updateLanguageButtons();
    },

    /**
     * Set current locale and refresh UI
     * @param {string} locale - Language code (de, en, it)
     */
    setLocale(locale) {
        if (!this.supportedLocales.includes(locale)) {
            console.warn(`Unsupported locale: ${locale}`);
            return;
        }
        this.currentLocale = locale;
        localStorage.setItem('locale', locale);
        this.applyTranslations();
        this.updateLanguageButtons();
    },

    /**
     * Translate a key to current locale
     * Supports nested keys like "nav.dashboard" and parameters like {count}
     * @param {string} key - Translation key
     * @param {object} params - Optional parameters for interpolation
     * @returns {string} Translated text or key as fallback
     */
    t(key, params = {}) {
        if (!key) return '';

        const keys = key.split('.');
        let value = this.translations[this.currentLocale];

        // Navigate nested structure
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = undefined;
                break;
            }
        }

        // Fallback to German if not found
        if (value === undefined) {
            value = this.translations['de'];
            for (const k of keys) {
                if (value && typeof value === 'object') {
                    value = value[k];
                } else {
                    value = undefined;
                    break;
                }
            }
        }

        // Return key if still not found
        if (value === undefined || typeof value !== 'string') {
            console.warn(`Missing translation: ${key}`);
            return key;
        }

        // Replace parameters: {name} -> params.name
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
            return params[paramKey] !== undefined ? params[paramKey] : match;
        });
    },

    /**
     * Apply translations to all elements with data-i18n attributes
     */
    applyTranslations() {
        // Text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.textContent = this.t(key);
            }
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.placeholder = this.t(key);
            }
        });

        // Title/Tooltip attributes
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.title = this.t(key);
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLocale;
    },

    /**
     * Update language switcher button states
     */
    updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === this.currentLocale;
            btn.classList.toggle('active', isActive);
        });
    },

    /**
     * Get current locale
     * @returns {string} Current locale code
     */
    getLocale() {
        return this.currentLocale;
    },

    /**
     * Check if a translation key exists
     * @param {string} key - Translation key
     * @returns {boolean}
     */
    has(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLocale];
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return false;
            }
        }
        return value !== undefined;
    }
};
