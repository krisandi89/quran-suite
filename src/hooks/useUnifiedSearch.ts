/**
 * Custom hook for unified search functionality with debounce and request cancellation
 * Supports searching across Quran, Tafsir, and Hadith with scope filtering
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { searchAll } from '@/services';
import { config } from '@/config';
import type {
    SearchResult,
    SearchMode,
    SearchScope,
    TafsirSearchResult,
    HadithSearchResult,
    UnifiedSearchResults,
} from '@/types';

// Extended state for unified search
interface UnifiedSearchState {
    query: string;
    mode: SearchMode;
    scope: SearchScope;
    results: UnifiedSearchResults;
    isLoading: boolean;
    error: string | null;
    selectedIndex: number;
    selectedCategory: 'quran' | 'tafsir' | 'hadith';
}

// Flat result type for navigation
type FlatResult =
    | { type: 'quran'; data: SearchResult }
    | { type: 'tafsir'; data: TafsirSearchResult }
    | { type: 'hadith'; data: HadithSearchResult };

const EMPTY_RESULTS: UnifiedSearchResults = {
    quran: [],
    tafsir: [],
    hadith: [],
};

export function useUnifiedSearch() {
    // State
    const [state, setState] = useState<UnifiedSearchState>({
        query: '',
        mode: 'indonesian',
        scope: 'all',
        results: EMPTY_RESULTS,
        isLoading: false,
        error: null,
        selectedIndex: 0,
        selectedCategory: 'quran',
    });

    // Refs for debounce and abort
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Get flattened list of results for keyboard navigation
     */
    const getFlatResults = useCallback((): FlatResult[] => {
        const flat: FlatResult[] = [];

        if (state.scope === 'all' || state.scope === 'quran') {
            state.results.quran.forEach(r => flat.push({ type: 'quran', data: r }));
        }
        if (state.scope === 'all' || state.scope === 'tafsir') {
            state.results.tafsir.forEach(r => flat.push({ type: 'tafsir', data: r }));
        }
        if (state.scope === 'all' || state.scope === 'hadith') {
            state.results.hadith.forEach(r => flat.push({ type: 'hadith', data: r }));
        }

        return flat;
    }, [state.results, state.scope]);

    /**
     * Get total result count
     */
    const getTotalCount = useCallback((): number => {
        return state.results.quran.length + state.results.tafsir.length + state.results.hadith.length;
    }, [state.results]);

    /**
     * Update query with debounced search
     */
    const setQuery = useCallback((query: string) => {
        setState(prev => ({ ...prev, query, selectedIndex: 0 }));
    }, []);

    /**
     * Toggle search mode (Indonesian/Arabic)
     */
    const setMode = useCallback((mode: SearchMode) => {
        setState(prev => ({ ...prev, mode, selectedIndex: 0 }));
    }, []);

    /**
     * Set search scope
     */
    const setScope = useCallback((scope: SearchScope) => {
        setState(prev => ({ ...prev, scope, selectedIndex: 0 }));
    }, []);

    /**
     * Navigate selection up
     */
    const selectPrevious = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedIndex: Math.max(0, prev.selectedIndex - 1),
        }));
    }, []);

    /**
     * Navigate selection down
     */
    const selectNext = useCallback(() => {
        const flatResults = getFlatResults();
        setState(prev => ({
            ...prev,
            selectedIndex: Math.min(flatResults.length - 1, prev.selectedIndex + 1),
        }));
    }, [getFlatResults]);

    /**
     * Get currently selected result
     */
    const getSelectedResult = useCallback((): FlatResult | null => {
        const flatResults = getFlatResults();
        return flatResults[state.selectedIndex] || null;
    }, [getFlatResults, state.selectedIndex]);

    /**
     * Clear search
     */
    const clearSearch = useCallback(() => {
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setState(prev => ({
            ...prev,
            query: '',
            results: EMPTY_RESULTS,
            isLoading: false,
            error: null,
            selectedIndex: 0,
        }));
    }, []);

    // Effect: Debounced search
    useEffect(() => {
        const { query, mode, scope } = state;

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // If query is empty, clear results
        if (!query.trim()) {
            setState(prev => ({ ...prev, results: EMPTY_RESULTS, isLoading: false, error: null }));
            return;
        }

        // Show loading state
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Debounce the search
        debounceTimerRef.current = setTimeout(async () => {
            // Create new abort controller
            abortControllerRef.current = new AbortController();

            try {
                const results = await searchAll(query, scope, mode, abortControllerRef.current.signal);
                setState(prev => ({
                    ...prev,
                    results,
                    isLoading: false,
                    error: null,
                }));
            } catch (error) {
                // Ignore abort errors
                if ((error as Error).name === 'AbortError') {
                    return;
                }
                setState(prev => ({
                    ...prev,
                    results: EMPTY_RESULTS,
                    isLoading: false,
                    error: (error as Error).message || 'Search failed',
                }));
            }
        }, config.SEARCH.DEBOUNCE_MS);

        // Cleanup
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [state.query, state.mode, state.scope]);

    return {
        query: state.query,
        mode: state.mode,
        scope: state.scope,
        results: state.results,
        isLoading: state.isLoading,
        error: state.error,
        selectedIndex: state.selectedIndex,
        setQuery,
        setMode,
        setScope,
        selectPrevious,
        selectNext,
        getSelectedResult,
        getFlatResults,
        getTotalCount,
        clearSearch,
    };
}

// Re-export old hook for backward compatibility
export { useSearch } from './useSearchLegacy';
