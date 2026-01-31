/**
 * Quran Foundation Search Provider
 * Primary search provider using Quran.com API
 * 
 * API Docs: https://api-docs.quran.com/
 */
import { config } from '@/config';
import type { ISearchProvider, SearchResult, SearchMode } from '@/types';

// Response types from Quran Foundation API
interface QFSearchResult {
    verse_key: string; // e.g. "2:153"
    text: string;      // The matched text
    highlighted?: string; // With <em> tags
}

interface QFSearchResponse {
    search: {
        query: string;
        total_results: number;
        results: QFSearchResult[];
    };
}

export class QuranFoundationProvider implements ISearchProvider {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.QURAN_FOUNDATION.BASE_URL;
    }

    getName(): string {
        return 'Quran Foundation';
    }

    /**
     * Search Quran using Quran Foundation API
     */
    async search(query: string, mode: SearchMode, signal?: AbortSignal): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        try {
            // Determine language for search
            // For Indonesian, we search translations
            // For Arabic, we search the Arabic text
            const language = mode === 'indonesian' ? 'id' : 'ar';

            // Use the search endpoint
            const url = new URL(`${this.baseUrl}/search`);
            url.searchParams.set('q', query);
            url.searchParams.set('size', config.SEARCH.MAX_RESULTS.toString());
            url.searchParams.set('language', language);

            const response = await fetch(url.toString(), { signal });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data: QFSearchResponse = await response.json();

            // Convert to our SearchResult format
            return this.convertResults(data.search.results, mode, query);
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw error; // Re-throw abort errors
            }
            console.error('[QuranFoundationProvider] Search error:', error);
            throw new Error('Failed to search. Please try again.');
        }
    }

    /**
     * Convert API results to our format with verse details
     */
    private async convertResults(
        results: QFSearchResult[],
        mode: SearchMode,
        query: string
    ): Promise<SearchResult[]> {
        // For each result, we need to fetch full verse data
        const searchResults: SearchResult[] = [];

        for (const result of results) {
            const [surahNum, ayahNum] = result.verse_key.split(':').map(Number);

            try {
                // Fetch verse with translations
                const verseUrl = `${this.baseUrl}/verses/by_key/${result.verse_key}?translations=33`; // 33 = Indonesian
                const verseResponse = await fetch(verseUrl);

                if (!verseResponse.ok) continue;

                const verseData = await verseResponse.json();
                const verse = verseData.verse;

                // Get surah info
                const surahUrl = `${this.baseUrl}/chapters/${surahNum}`;
                const surahResponse = await fetch(surahUrl);
                const surahData = await surahResponse.json();
                const surah = surahData.chapter;

                searchResults.push({
                    surah: {
                        number: surahNum,
                        name: surah?.name_arabic || `Surah ${surahNum}`,
                        englishName: surah?.name_simple || `Surah ${surahNum}`,
                    },
                    ayah: ayahNum,
                    text: {
                        arabic: verse?.text_uthmani || '',
                        indonesian: verse?.translations?.[0]?.text || '',
                    },
                    matches: [{
                        type: mode === 'indonesian' ? 'translation' : 'arabic',
                        text: query,
                    }],
                });
            } catch (e) {
                console.warn(`Failed to fetch verse ${result.verse_key}:`, e);
            }
        }

        return searchResults;
    }
}
