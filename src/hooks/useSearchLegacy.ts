/**
 * Custom hook for search functionality with debounce and request cancellation
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { searchQuran } from '@/services';
import { config } from '@/config';
import type { SearchResult, SearchMode, SearchState } from '@/types';

export function useSearch() {
    // State
    const [state, setState] = useState<SearchState>({
        query: '',
        mode: 'indonesian' as SearchMode,
        results: [],
        isLoading: false,
        error: null,
        selectedIndex: 0,
    });

    // Refs for debounce and abort
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Update query with debounced search
     */
    const setQuery = useCallback((query: string) => {
        setState(prev => ({ ...prev, query, selectedIndex: 0 }));
    }, []);

    /**
     * Toggle search mode
     */
    const setMode = useCallback((mode: SearchMode) => {
        setState(prev => ({ ...prev, mode, selectedIndex: 0 }));
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
        setState(prev => ({
            ...prev,
            selectedIndex: Math.min(prev.results.length - 1, prev.selectedIndex + 1),
        }));
    }, []);

    /**
     * Get currently selected result
     */
    const getSelectedResult = useCallback((): SearchResult | null => {
        return state.results[state.selectedIndex] || null;
    }, [state.results, state.selectedIndex]);

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
        setState({
            query: '',
            mode: state.mode,
            results: [],
            isLoading: false,
            error: null,
            selectedIndex: 0,
        });
    }, [state.mode]);

    // Effect: Debounced search
    useEffect(() => {
        const { query, mode } = state;

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
            setState(prev => ({ ...prev, results: [], isLoading: false, error: null }));
            return;
        }

        // Show loading state
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Debounce the search
        debounceTimerRef.current = setTimeout(async () => {
            // Create new abort controller
            abortControllerRef.current = new AbortController();

            try {
                const results = await searchQuran(query, mode, abortControllerRef.current.signal);
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
                    results: [],
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
    }, [state.query, state.mode]);

    return {
        ...state,
        setQuery,
        setMode,
        selectPrevious,
        selectNext,
        getSelectedResult,
        clearSearch,
    };
}
