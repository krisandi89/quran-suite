/**
 * Hadith Service
 * Handles searching Hadith from hadith-api.gading.dev
 * 
 * Supports: Bukhari, Muslim, Ahmad, Tirmidzi
 */
import { config } from '@/config';
import type {
    IHadithProvider,
    HadithSearchResult,
    HadithEntry,
    HadithCollection,
} from '@/types';
import { LRUCache } from '../cache';

// API response types
interface HadithApiItem {
    number: number;
    arab: string;
    id: string; // Indonesian translation
}

interface HadithApiData {
    name: string;
    id: string;
    available: number;
    requested: number;
    hadiths: HadithApiItem[];
}

// API wraps everything in a 'data' object
interface HadithApiResponse {
    code: number;
    message: string;
    data: HadithApiData;
}

interface HadithSingleApiResponse {
    code: number;
    message: string;
    data: HadithApiItem;
}

// In-memory hadith cache
interface HadithDataCache {
    data: Map<string, HadithEntry>; // key: "collection:number"
    isLoaded: Map<HadithCollection, boolean>;
}

const hadithData: HadithDataCache = {
    data: new Map(),
    isLoaded: new Map([
        ['bukhari', false],
        ['muslim', false],
        ['ahmad', false],
        ['tirmidzi', false],
    ]),
};

// Search result cache
const searchCache = new LRUCache<string, HadithSearchResult[]>(100);

// Collection name mappings for API
const API_COLLECTION_NAMES: Record<HadithCollection, string> = {
    bukhari: 'bukhari',
    muslim: 'muslim',
    ahmad: 'ahmad',
    tirmidzi: 'tirmidzi',
};

const COLLECTION_DISPLAY_NAMES: Record<HadithCollection, string> = {
    bukhari: 'Sahih Bukhari',
    muslim: 'Sahih Muslim',
    ahmad: 'Musnad Ahmad',
    tirmidzi: 'Jami\' at-Tirmidzi',
};

export class HadithService implements IHadithProvider {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.HADITH_API?.BASE_URL || 'https://api.hadith.gading.dev';
    }

    getName(): string {
        return 'Hadith API';
    }

    /**
     * Search hadith by keyword
     */
    async search(
        query: string,
        collection?: HadithCollection,
        signal?: AbortSignal
    ): Promise<HadithSearchResult[]> {
        if (!query.trim()) return [];

        // Check cache first
        const cacheKey = `${query}|${collection || 'all'}`;
        const cached = searchCache.get(cacheKey);
        if (cached) {
            console.log('[HadithService] Cache hit for:', cacheKey);
            return cached;
        }

        const results: HadithSearchResult[] = [];
        const collectionsToSearch: HadithCollection[] = collection
            ? [collection]
            : ['bukhari', 'muslim', 'ahmad', 'tirmidzi'];

        // Search through each collection
        for (const col of collectionsToSearch) {
            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

            try {
                // Try to load from local data first
                const localResults = await this.searchLocal(query, col);
                if (localResults.length > 0) {
                    results.push(...localResults);
                    continue;
                }

                // Fall back to API search
                // Note: hadith-api doesn't have a search endpoint, 
                // so we fetch a range and filter locally
                const apiResults = await this.searchApi(query, col, signal);
                results.push(...apiResults);
            } catch (error) {
                if ((error as Error).name === 'AbortError') throw error;
                console.warn(`[HadithService] Failed to search ${col}:`, error);
            }

            // Limit total results
            if (results.length >= config.SEARCH.MAX_RESULTS) break;
        }

        // Cache and return
        const limitedResults = results.slice(0, config.SEARCH.MAX_RESULTS);
        searchCache.set(cacheKey, limitedResults);
        console.log(`[HadithService] Found ${limitedResults.length} results for:`, query);

        return limitedResults;
    }

    /**
     * Search local cached data
     */
    private async searchLocal(
        query: string,
        collection: HadithCollection
    ): Promise<HadithSearchResult[]> {
        const searchTerm = query.toLowerCase();
        const results: HadithSearchResult[] = [];

        for (const [key, entry] of hadithData.data) {
            if (!key.startsWith(collection)) continue;

            if (entry.indonesian.toLowerCase().includes(searchTerm)) {
                results.push(this.convertToSearchResult(entry));
            }

            if (results.length >= 5) break; // Limit per collection
        }

        return results;
    }

    /**
     * Search via API (fetch range and filter)
     */
    private async searchApi(
        query: string,
        collection: HadithCollection,
        signal?: AbortSignal
    ): Promise<HadithSearchResult[]> {
        const searchTerm = query.toLowerCase();
        const results: HadithSearchResult[] = [];
        const apiName = API_COLLECTION_NAMES[collection];

        // Fetch a range of hadith (1-100 for initial search)
        // In production, you'd use a proper full-text search index
        try {
            const url = `${this.baseUrl}/books/${apiName}?range=1-100`;
            const response = await fetch(url, { signal });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const apiResponse: HadithApiResponse = await response.json();
            const hadiths = apiResponse.data?.hadiths || [];

            for (const hadith of hadiths) {
                if (hadith.id.toLowerCase().includes(searchTerm)) {
                    const entry = this.convertApiToEntry(hadith, collection);

                    // Cache for future use
                    hadithData.data.set(`${collection}:${hadith.number}`, entry);

                    results.push(this.convertToSearchResult(entry, query));
                }

                if (results.length >= 5) break;
            }
        } catch (error) {
            if ((error as Error).name === 'AbortError') throw error;
            console.warn(`[HadithService] API search failed for ${collection}:`, error);
        }

        return results;
    }

    /**
     * Get specific hadith by collection and number
     */
    async getHadith(
        collection: HadithCollection,
        number: number,
        signal?: AbortSignal
    ): Promise<HadithEntry | null> {
        // Check cache first
        const cacheKey = `${collection}:${number}`;
        const cached = hadithData.data.get(cacheKey);
        if (cached) return cached;

        // Fetch from API
        try {
            const apiName = API_COLLECTION_NAMES[collection];
            const url = `${this.baseUrl}/books/${apiName}/${number}`;
            const response = await fetch(url, { signal });

            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error(`API error: ${response.status}`);
            }

            const apiResponse: HadithSingleApiResponse = await response.json();
            const entry = this.convertApiToEntry(apiResponse.data, collection);

            // Cache it
            hadithData.data.set(cacheKey, entry);

            return entry;
        } catch (error) {
            if ((error as Error).name === 'AbortError') throw error;
            console.error('[HadithService] getHadith error:', error);
            return null;
        }
    }

    /**
     * Convert API response to HadithEntry
     */
    private convertApiToEntry(apiItem: HadithApiItem, collection: HadithCollection): HadithEntry {
        return {
            id: `${collection}-${apiItem.number}`,
            collection,
            number: apiItem.number,
            narrators: [], // API doesn't provide this separately
            arabic: apiItem.arab,
            indonesian: apiItem.id,
        };
    }

    /**
     * Convert HadithEntry to HadithSearchResult
     */
    private convertToSearchResult(entry: HadithEntry, query?: string): HadithSearchResult {
        return {
            id: entry.id,
            collection: entry.collection,
            collectionName: COLLECTION_DISPLAY_NAMES[entry.collection],
            number: entry.number,
            narrators: entry.narrators,
            text: {
                arabic: entry.arabic,
                indonesian: entry.indonesian,
            },
            matches: query ? [{ text: query }] : [],
        };
    }
}

// Singleton instance
let hadithServiceInstance: HadithService | null = null;

export function getHadithService(): HadithService {
    if (!hadithServiceInstance) {
        hadithServiceInstance = new HadithService();
    }
    return hadithServiceInstance;
}
