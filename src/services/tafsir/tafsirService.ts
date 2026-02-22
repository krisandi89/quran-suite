/**
 * Tafsir Service
 * Handles loading and searching Tafsir data (Ibn Katsir & Jalalayn)
 * 
 * Uses local JSON data for fast Spotlight-style search
 */
import { config } from '@/config';
import type {
    ITafsirProvider,
    TafsirSearchResult,
    TafsirEntry,
    TafsirSource,
} from '@/types';
import { LRUCache } from '../cache';

// Surah metadata for search results
interface SurahMeta {
    number: number;
    name: string;
    englishName: string;
}

// Cached surah metadata
const SURAH_META: SurahMeta[] = [
    { number: 1, name: 'الفاتحة', englishName: 'Al-Fatihah' },
    { number: 2, name: 'البقرة', englishName: 'Al-Baqarah' },
    { number: 3, name: 'آل عمران', englishName: 'Ali \'Imran' },
    { number: 4, name: 'النساء', englishName: 'An-Nisa' },
    { number: 5, name: 'المائدة', englishName: 'Al-Ma\'idah' },
    { number: 6, name: 'الأنعام', englishName: 'Al-An\'am' },
    { number: 7, name: 'الأعراف', englishName: 'Al-A\'raf' },
    { number: 8, name: 'الأنفال', englishName: 'Al-Anfal' },
    { number: 9, name: 'التوبة', englishName: 'At-Tawbah' },
    { number: 10, name: 'يونس', englishName: 'Yunus' },
    // ... will be populated from data
];

// In-memory tafsir data cache
interface TafsirDataCache {
    kemenag: Map<string, TafsirEntry>; // key: "surah:ayah"
    ibnKatsir: Map<string, TafsirEntry>;
    jalalayn: Map<string, TafsirEntry>;
    isLoaded: boolean;
}

const tafsirData: TafsirDataCache = {
    kemenag: new Map(),
    ibnKatsir: new Map(),
    jalalayn: new Map(),
    isLoaded: false,
};

// Search result cache
const searchCache = new LRUCache<string, TafsirSearchResult[]>(50);

async function loadTafsirData(): Promise<void> {
    if (tafsirData.isLoaded) return;

    try {
        // Load Kemenag data (primary source, most complete)
        const kemenagResponse = await fetch('/data/tafsir/kemenag.json');
        if (kemenagResponse.ok) {
            const data: TafsirEntry[] = await kemenagResponse.json();
            data.forEach(entry => {
                tafsirData.kemenag.set(`${entry.surah}:${entry.ayah}`, entry);
            });
            console.log(`[TafsirService] Loaded ${data.length} Kemenag entries`);
        }

        // Note: Ibn Katsir and Jalalayn not available in Indonesian
        // Using Kemenag as the primary tafsir source

        tafsirData.isLoaded = true;
    } catch (error) {
        console.error('[TafsirService] Failed to load tafsir data:', error);
    }
}

/**
 * Get surah metadata by number
 */
function getSurahMeta(surahNum: number): SurahMeta {
    return SURAH_META[surahNum - 1] || { number: surahNum, name: '', englishName: `Surah ${surahNum}` };
}

export class TafsirService implements ITafsirProvider {
    private initialized = false;

    getName(): string {
        return 'Local Tafsir';
    }

    /**
     * Initialize by loading tafsir data
     */
    async init(): Promise<void> {
        if (this.initialized) return;
        await loadTafsirData();
        this.initialized = true;
    }

    /**
     * Search tafsir text
     */
    async search(
        query: string,
        source?: TafsirSource,
        signal?: AbortSignal
    ): Promise<TafsirSearchResult[]> {
        await this.init();

        if (!query.trim()) return [];

        // Check cache
        const cacheKey = `${query}|${source || 'all'}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
            console.log('[TafsirService] Cache hit for:', cacheKey);
            return cached;
        }

        const searchTerm = query.toLowerCase();
        const results: TafsirSearchResult[] = [];
        const maxResults = config.SEARCH.MAX_RESULTS;

        // Search through both sources or specific source
        const sources: TafsirSource[] = source ? [source] : ['kemenag', 'ibn_katsir', 'jalalayn'];

        for (const src of sources) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

            let dataMap: Map<string, TafsirEntry>;
            let sourceName: string;

            switch (src) {
                case 'kemenag':
                    dataMap = tafsirData.kemenag;
                    sourceName = 'Tafsir Kemenag';
                    break;
                case 'ibn_katsir':
                    dataMap = tafsirData.ibnKatsir;
                    sourceName = 'Tafsir Ibn Katsir';
                    break;
                default:
                    dataMap = tafsirData.jalalayn;
                    sourceName = 'Tafsir al-Jalalayn';
            }

            for (const [, entry] of dataMap) {
                if (results.length >= maxResults) break;

                if (entry.text.toLowerCase().includes(searchTerm)) {
                    const surahMeta = getSurahMeta(entry.surah);
                    results.push({
                        surah: {
                            number: entry.surah,
                            name: surahMeta.name,
                            englishName: surahMeta.englishName,
                        },
                        ayah: entry.ayah,
                        source: src,
                        sourceName,
                        text: entry.text,
                        matches: [{ text: query }],
                    });
                }
            }
        }

        // Cache results
        searchCache.set(cacheKey, results);
        console.log(`[TafsirService] Found ${results.length} results for:`, query);

        return results;
    }

    /**
     * Get specific tafsir entry
     */
    async getTafsir(
        surah: number,
        ayah: number,
        source: TafsirSource,
        signal?: AbortSignal
    ): Promise<TafsirEntry | null> {
        await this.init();

        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        const key = `${surah}:${ayah}`;
        let dataMap: Map<string, TafsirEntry>;

        switch (source) {
            case 'kemenag':
                dataMap = tafsirData.kemenag;
                break;
            case 'ibn_katsir':
                dataMap = tafsirData.ibnKatsir;
                break;
            default:
                dataMap = tafsirData.jalalayn;
        }

        return dataMap.get(key) || null;
    }
}

// Singleton instance
let tafsirServiceInstance: TafsirService | null = null;

export function getTafsirService(): TafsirService {
    if (!tafsirServiceInstance) {
        tafsirServiceInstance = new TafsirService();
    }
    return tafsirServiceInstance;
}
