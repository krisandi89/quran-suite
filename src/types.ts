/**
 * Core types for Quran data and search functionality
 */

// Surah (Chapter) information
export interface Surah {
    number: number;           // 1-114
    name: string;             // Arabic name
    englishName: string;      // English transliteration
    englishNameTranslation: string; // English meaning
    numberOfAyahs: number;    // Total verses
    revelationType: 'Meccan' | 'Medinan';
}

// Individual verse/ayah
export interface Verse {
    surah: number;
    ayah: number;
    arabic: string;
    indonesian: string;
}

// Search result with match highlighting info
export interface SearchResult {
    surah: {
        number: number;
        name: string;
        englishName: string;
    };
    ayah: number;
    text: {
        arabic: string;
        indonesian: string;
    };
    // Matches for highlighting
    matches: {
        type: 'arabic' | 'translation';
        text: string;
    }[];
}

// Verse detail (expanded verse info)
export interface VerseDetail extends Verse {
    surahName: string;
    surahEnglishName: string;
    audioUrl?: string;
    tafsir?: string;
}

// Search mode
export type SearchMode = 'indonesian' | 'arabic';

// State for search
export interface SearchState {
    query: string;
    mode: SearchMode;
    results: SearchResult[];
    isLoading: boolean;
    error: string | null;
    selectedIndex: number;
}

// Provider interface for search
export interface ISearchProvider {
    search(query: string, mode: SearchMode, signal?: AbortSignal): Promise<SearchResult[]>;
    getName(): string;
}

// Provider interface for verse details
export interface IVerseDetailProvider {
    getVerse(surah: number, ayah: number, signal?: AbortSignal): Promise<VerseDetail>;
    getName(): string;
}

// ============================================
// Extended Types for Tafsir & Hadith Search
// ============================================

// Search scope for filtering
export type SearchScope = 'all' | 'quran' | 'tafsir' | 'hadith';

// Tafsir source types
export type TafsirSource = 'kemenag' | 'ibn_katsir' | 'jalalayn';

// Hadith collection types
export type HadithCollection = 'bukhari' | 'muslim' | 'ahmad' | 'tirmidzi';

// Collection display names
export const HADITH_COLLECTION_NAMES: Record<HadithCollection, string> = {
    bukhari: 'Sahih Bukhari',
    muslim: 'Sahih Muslim',
    ahmad: 'Musnad Ahmad',
    tirmidzi: 'Jami\' at-Tirmidzi',
};

export const TAFSIR_SOURCE_NAMES: Record<TafsirSource, string> = {
    kemenag: 'Tafsir Kemenag',
    ibn_katsir: 'Tafsir Ibn Katsir',
    jalalayn: 'Tafsir al-Jalalayn',
};

// Tafsir entry schema (for data storage)
export interface TafsirEntry {
    surah: number;
    ayah: number;
    source: TafsirSource;
    text: string;
}

// Hadith entry schema (for data storage)
export interface HadithEntry {
    id: string;
    collection: HadithCollection;
    number: number;
    narrators: string[];
    arabic: string;
    indonesian: string;
}

// Tafsir search result
export interface TafsirSearchResult {
    surah: {
        number: number;
        name: string;
        englishName: string;
    };
    ayah: number;
    source: TafsirSource;
    sourceName: string;
    text: string;
    matches: { text: string }[];
}

// Hadith search result
export interface HadithSearchResult {
    id: string;
    collection: HadithCollection;
    collectionName: string;
    number: number;
    narrators: string[];
    text: {
        arabic: string;
        indonesian: string;
    };
    matches: { text: string }[];
}

// Unified search results (grouped by category)
export interface UnifiedSearchResults {
    quran: SearchResult[];
    tafsir: TafsirSearchResult[];
    hadith: HadithSearchResult[];
}

// Extended search state with scope
export interface ExtendedSearchState extends SearchState {
    scope: SearchScope;
    unifiedResults: UnifiedSearchResults;
}

// Provider interface for Tafsir
export interface ITafsirProvider {
    search(query: string, source?: TafsirSource, signal?: AbortSignal): Promise<TafsirSearchResult[]>;
    getTafsir(surah: number, ayah: number, source: TafsirSource, signal?: AbortSignal): Promise<TafsirEntry | null>;
    getName(): string;
}

// Provider interface for Hadith
export interface IHadithProvider {
    search(query: string, collection?: HadithCollection, signal?: AbortSignal): Promise<HadithSearchResult[]>;
    getHadith(collection: HadithCollection, number: number, signal?: AbortSignal): Promise<HadithEntry | null>;
    getName(): string;
}
