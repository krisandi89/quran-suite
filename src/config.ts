/**
 * Configuration file for Al-Quran Suite API providers
 * 
 * To switch providers:
 * 1. Set ACTIVE_SEARCH_PROVIDER to 'quranFoundation' or 'kemenag' (when implemented)
 * 2. Set ACTIVE_VERSE_PROVIDER to 'equran' or 'kemenag' (when implemented)
 * 
 * For Kemenag provider (token-based):
 * 1. Obtain an API token from Kemenag
 * 2. Set KEMENAG_API_TOKEN below
 * 3. Switch ACTIVE_SEARCH_PROVIDER to 'kemenag'
 */

export const config = {
    // Active provider selection
    ACTIVE_SEARCH_PROVIDER: 'quranFoundation' as 'quranFoundation' | 'kemenag',
    ACTIVE_VERSE_PROVIDER: 'equran' as 'equran' | 'kemenag',

    // Quran Foundation API (Primary Search)
    // Docs: https://api-docs.quran.com/
    QURAN_FOUNDATION: {
        BASE_URL: 'https://api.quran.com/api/v4',
        // No API key required for basic usage
    },

    // eQuran.id API (Fallback Verse Detail)
    // Indonesian Quran with translation
    EQURAN: {
        BASE_URL: 'https://equran.id/api/v2',
        // No API key required
    },

    // Kemenag API (Future provider - token-based)
    // To enable: get token from Kemenag and set here
    KEMENAG: {
        BASE_URL: 'https://api.kemenag.go.id/quran', // Example URL
        API_TOKEN: '', // Set your token here
    },

    // Cache settings
    CACHE: {
        SEARCH_LRU_SIZE: 100,   // Increased for multi-scope queries
        VERSE_CACHE_SIZE: 200, // Max cached verse details
        TAFSIR_CACHE_SIZE: 100, // Max cached tafsir entries
        HADITH_CACHE_SIZE: 200, // Max cached hadith entries
    },

    // Search settings
    SEARCH: {
        DEBOUNCE_MS: 200,      // Debounce delay
        MAX_RESULTS: 500,       // Max results per search
    },

    // Hadith API (https://api.hadith.gading.dev)
    HADITH_API: {
        BASE_URL: 'https://api.hadith.gading.dev',
    },

    // Local data paths (for pre-loaded JSON data)
    DATA: {
        QURAN_PATH: '/data/quran',
        TAFSIR_KEMENAG_PATH: '/data/tafsir/kemenag.json',
        TAFSIR_IBN_KATSIR_PATH: '/data/tafsir/ibn-katsir.json',
        TAFSIR_JALALAYN_PATH: '/data/tafsir/jalalayn.json',
        HADITH_PATH: '/data/hadith',
    },
} as const;

export type SearchProviderType = typeof config.ACTIVE_SEARCH_PROVIDER;
export type VerseProviderType = typeof config.ACTIVE_VERSE_PROVIDER;
