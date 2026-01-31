/**
 * Provider Manager
 * Factory for creating and managing Quran, Tafsir, and Hadith data providers
 * Easily swap providers via config
 */
import { config } from '@/config';
import type {
    ISearchProvider,
    IVerseDetailProvider,
    SearchResult,
    VerseDetail,
    SearchMode,
    SearchScope,
    UnifiedSearchResults,
    TafsirEntry,
    TafsirSource,
    HadithEntry,
    HadithCollection,
} from '@/types';
import { LRUCache, VerseCache } from './cache';
import { QuranFoundationProvider } from './providers/quranFoundation';
import { EQuranIdProvider } from './providers/equranId';
import { getTafsirService } from './tafsir/tafsirService';
import { getHadithService } from './hadith/hadithService';

// Singleton instances
let searchProvider: ISearchProvider | null = null;
let verseProvider: IVerseDetailProvider | null = null;

// Caches
const searchCache = new LRUCache<string, SearchResult[]>(config.CACHE.SEARCH_LRU_SIZE);
const unifiedSearchCache = new LRUCache<string, UnifiedSearchResults>(config.CACHE.SEARCH_LRU_SIZE);
const verseCache = new VerseCache<VerseDetail>(config.CACHE.VERSE_CACHE_SIZE);

/**
 * Get the currently configured search provider
 */
export function getSearchProvider(): ISearchProvider {
    if (!searchProvider) {
        switch (config.ACTIVE_SEARCH_PROVIDER) {
            case 'quranFoundation':
                searchProvider = new QuranFoundationProvider();
                break;
            case 'kemenag':
                // TODO: Implement KemenagProvider when available
                console.warn('Kemenag provider not yet implemented, falling back to QuranFoundation');
                searchProvider = new QuranFoundationProvider();
                break;
            default:
                searchProvider = new QuranFoundationProvider();
        }
    }
    return searchProvider;
}

/**
 * Get the currently configured verse detail provider
 */
export function getVerseDetailProvider(): IVerseDetailProvider {
    if (!verseProvider) {
        switch (config.ACTIVE_VERSE_PROVIDER) {
            case 'equran':
                verseProvider = new EQuranIdProvider();
                break;
            case 'kemenag':
                // TODO: Implement KemenagProvider when available
                console.warn('Kemenag provider not yet implemented, falling back to eQuran.id');
                verseProvider = new EQuranIdProvider();
                break;
            default:
                verseProvider = new EQuranIdProvider();
        }
    }
    return verseProvider;
}

/**
 * Search Quran only with caching
 */
export async function searchQuran(
    query: string,
    mode: SearchMode,
    signal?: AbortSignal
): Promise<SearchResult[]> {
    const cacheKey = `quran|${query}|${mode}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached) {
        console.log('[ProviderManager] Cache hit for:', cacheKey);
        return cached;
    }

    // Fetch from provider
    const provider = getSearchProvider();
    const results = await provider.search(query, mode, signal);

    // Cache results
    searchCache.set(cacheKey, results);
    console.log(`[ProviderManager] Cached ${results.length} results for:`, cacheKey);

    return results;
}

/**
 * Unified search across all sources (Quran, Tafsir, Hadith)
 */
export async function searchAll(
    query: string,
    scope: SearchScope,
    mode: SearchMode = 'indonesian',
    signal?: AbortSignal
): Promise<UnifiedSearchResults> {
    const cacheKey = `unified|${query}|${scope}|${mode}`;

    // Check cache first
    const cached = unifiedSearchCache.get(cacheKey);
    if (cached) {
        console.log('[ProviderManager] Unified cache hit for:', cacheKey);
        return cached;
    }

    const results: UnifiedSearchResults = {
        quran: [],
        tafsir: [],
        hadith: [],
    };

    // Search based on scope
    const searchPromises: Promise<void>[] = [];

    // Quran search
    if (scope === 'all' || scope === 'quran') {
        searchPromises.push(
            searchQuran(query, mode, signal)
                .then(r => { results.quran = r; })
                .catch(err => {
                    if (err.name !== 'AbortError') console.error('[ProviderManager] Quran search error:', err);
                })
        );
    }

    // Tafsir search
    if (scope === 'all' || scope === 'tafsir') {
        const tafsirService = getTafsirService();
        searchPromises.push(
            tafsirService.search(query, undefined, signal)
                .then(r => { results.tafsir = r; })
                .catch(err => {
                    if (err.name !== 'AbortError') console.error('[ProviderManager] Tafsir search error:', err);
                })
        );
    }

    // Hadith search
    if (scope === 'all' || scope === 'hadith') {
        const hadithService = getHadithService();
        searchPromises.push(
            hadithService.search(query, undefined, signal)
                .then(r => { results.hadith = r; })
                .catch(err => {
                    if (err.name !== 'AbortError') console.error('[ProviderManager] Hadith search error:', err);
                })
        );
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    // Cache unified results
    unifiedSearchCache.set(cacheKey, results);
    const totalResults = results.quran.length + results.tafsir.length + results.hadith.length;
    console.log(`[ProviderManager] Unified search: ${totalResults} total results for:`, query);

    return results;
}

/**
 * Get Tafsir for a specific verse
 */
export async function getTafsir(
    surah: number,
    ayah: number,
    source: TafsirSource,
    signal?: AbortSignal
): Promise<TafsirEntry | null> {
    const tafsirService = getTafsirService();
    return tafsirService.getTafsir(surah, ayah, source, signal);
}

/**
 * Get specific Hadith by collection and number
 */
export async function getHadith(
    collection: HadithCollection,
    number: number,
    signal?: AbortSignal
): Promise<HadithEntry | null> {
    const hadithService = getHadithService();
    return hadithService.getHadith(collection, number, signal);
}

/**
 * Get verse detail with caching
 */
export async function getVerseDetail(
    surah: number,
    ayah: number,
    signal?: AbortSignal
): Promise<VerseDetail> {
    // Check cache first
    const cached = verseCache.get(surah, ayah);
    if (cached) {
        console.log(`[ProviderManager] Cache hit for verse ${surah}:${ayah}`);
        return cached;
    }

    // Fetch from provider
    const provider = getVerseDetailProvider();
    const verse = await provider.getVerse(surah, ayah, signal);

    // Cache result
    verseCache.set(surah, ayah, verse);

    return verse;
}

/**
 * Clear all caches
 */
export function clearCaches(): void {
    searchCache.clear();
    unifiedSearchCache.clear();
    verseCache.clear();
    console.log('[ProviderManager] All caches cleared');
}

/**
 * Get provider info for debugging
 */
export function getProviderInfo(): { search: string; verse: string; tafsir: string; hadith: string } {
    return {
        search: getSearchProvider().getName(),
        verse: getVerseDetailProvider().getName(),
        tafsir: getTafsirService().getName(),
        hadith: getHadithService().getName(),
    };
}

