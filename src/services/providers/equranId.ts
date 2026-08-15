/**
 * eQuran.id Provider
 * Fallback provider for verse details with Indonesian translation
 * 
 * API: https://equran.id/api/v2
 */
import { config } from '@/config';
import type { IVerseDetailProvider, ISearchProvider, VerseDetail, SearchResult, SearchMode } from '@/types';

// Response types from eQuran.id API
interface EQuranSurah {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
    tempatTurun: string;
    arti: string;
    deskripsi: string;
    audioFull: Record<string, string>;
}

interface EQuranAyat {
    nomorAyat: number;
    teksArab: string;
    teksLatin: string;
    teksIndonesia: string;
    audio: Record<string, string>;
}

interface EQuranSurahResponse {
    code: number;
    message: string;
    data: EQuranSurah & {
        ayat: EQuranAyat[];
    };
}

export class EQuranIdProvider implements IVerseDetailProvider, ISearchProvider {
    private baseUrl: string;
    private surahCache: Map<number, EQuranSurah & { ayat: EQuranAyat[] }> = new Map();

    constructor() {
        this.baseUrl = config.EQURAN.BASE_URL;
    }

    getName(): string {
        return 'eQuran.id';
    }

    /**
     * Get verse detail by surah and ayah number
     * Note: equran.id doesn't support /surat/{surah}/{ayah} endpoint anymore,
     * so we fetch the full surah and extract the specific ayah
     */
    async getVerse(surah: number, ayah: number, signal?: AbortSignal): Promise<VerseDetail> {
        try {
            // Try to get from cache first
            if (this.surahCache.has(surah)) {
                const cached = this.surahCache.get(surah)!;
                const verse = cached.ayat.find(a => a.nomorAyat === ayah);
                if (verse) {
                    return this.convertToVerseDetail(cached, verse, surah, ayah);
                }
            }

            // Fetch full surah (the verse-specific endpoint no longer works)
            const url = `${this.baseUrl}/surat/${surah}`;
            const response = await fetch(url, { signal });

            if (!response.ok) {
                throw new Error(`Failed to fetch surah: ${response.status}`);
            }

            const data: EQuranSurahResponse = await response.json();

            if (data.code !== 200) {
                throw new Error(data.message);
            }

            // Cache the surah for future requests
            this.surahCache.set(surah, data.data);

            // Find the specific ayah
            const verse = data.data.ayat.find(a => a.nomorAyat === ayah);
            if (!verse) {
                throw new Error(`Ayah ${ayah} not found in Surah ${surah}`);
            }

            return this.convertToVerseDetail(data.data, verse, surah, ayah);
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw error;
            }
            console.error('[EQuranIdProvider] getVerse error:', error);
            throw new Error('Failed to fetch verse details.');
        }
    }

    /**
     * Get full surah with all ayahs
     */
    async getFullSurah(surah: number, signal?: AbortSignal) {
        try {
            if (this.surahCache.has(surah)) {
                return this.surahCache.get(surah)!;
            }

            const url = `${this.baseUrl}/surat/${surah}`;
            const response = await fetch(url, { signal });

            if (!response.ok) {
                throw new Error(`Failed to fetch surah: ${response.status}`);
            }

            const data: EQuranSurahResponse = await response.json();

            if (data.code !== 200) {
                throw new Error(data.message);
            }

            this.surahCache.set(surah, data.data);
            return data.data;
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw error;
            }
            console.error('[EQuranIdProvider] getFullSurah error:', error);
            throw new Error('Failed to fetch full surah.');
        }
    }

    /**
     * Search Quran using eQuran.id
     * Note: eQuran.id doesn't have a search API, so we fetch all surahs and search locally
     * This is used as a fallback or for offline mode
     */
    async search(query: string, mode: SearchMode, signal?: AbortSignal): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        const results: SearchResult[] = [];
        const searchTerm = query.toLowerCase();

        // For a real implementation, you'd want to pre-load all data
        // Here we do a simplified search through cached surahs
        // In MVP, we rely on QuranFoundation for search

        // Search through all 114 surahs (simplified - would be paginated in production)
        for (let surahNum = 1; surahNum <= 114 && results.length < 10; surahNum++) {
            try {
                // Check if aborted
                if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

                // Fetch surah if not cached
                if (!this.surahCache.has(surahNum)) {
                    const url = `${this.baseUrl}/surat/${surahNum}`;
                    const response = await fetch(url, { signal });
                    if (!response.ok) continue;
                    const data: EQuranSurahResponse = await response.json();
                    if (data.code === 200) {
                        this.surahCache.set(surahNum, data.data);
                    }
                }

                const surah = this.surahCache.get(surahNum);
                if (!surah) continue;

                // Search through verses
                for (const ayat of surah.ayat) {
                    const textToSearch = mode === 'indonesian'
                        ? ayat.teksIndonesia.toLowerCase()
                        : ayat.teksArab;

                    if (textToSearch.includes(searchTerm)) {
                        results.push({
                            surah: {
                                number: surahNum,
                                name: surah.nama,
                                englishName: surah.namaLatin,
                            },
                            ayah: ayat.nomorAyat,
                            text: {
                                arabic: ayat.teksArab,
                                indonesian: ayat.teksIndonesia,
                            },
                            matches: [{
                                type: mode === 'indonesian' ? 'translation' : 'arabic',
                                text: query,
                            }],
                        });

                        if (results.length >= config.SEARCH.MAX_RESULTS) break;
                    }
                }
            } catch (e) {
                if ((e as Error).name === 'AbortError') throw e;
                console.warn(`Failed to search surah ${surahNum}:`, e);
            }
        }

        return results;
    }

    private convertToVerseDetail(
        surah: EQuranSurah,
        ayat: EQuranAyat,
        surahNum: number,
        ayahNum: number
    ): VerseDetail {
        return {
            surah: surahNum,
            ayah: ayahNum,
            arabic: ayat.teksArab,
            indonesian: ayat.teksIndonesia,
            surahName: surah.nama,
            surahEnglishName: surah.namaLatin,
            audioUrl: ayat.audio?.['01'], // First audio source
        };
    }
}
