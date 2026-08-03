/**
 * Spotlight Search Modal
 * Main search interface with Cmd+K trigger
 * Supports unified search across Quran, Tafsir, and Hadith
 */
import { useRef, useEffect, useState } from 'react';
import { Search, X, Loader2, AlertCircle, BookOpen, BookMarked, ScrollText } from 'lucide-react';
import { ResultItem } from './ResultItem';
import { TafsirResultItem } from './TafsirResultItem';
import { HadithResultItem } from './HadithResultItem';
import { VerseDrawer } from './VerseDrawer';
import { TafsirDrawer } from './TafsirDrawer';
import { HadithDrawer } from './HadithDrawer';
import { useUnifiedSearch, useKeyboardShortcuts } from '@/hooks';
import type { SearchScope, SearchResult, TafsirSearchResult, HadithSearchResult, TafsirSource, HadithCollection } from '@/types';

interface SpotlightProps {
    isOpen: boolean;
    onClose: () => void;
}

// Scope configuration
const SCOPE_CONFIG: { value: SearchScope; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Semua', icon: <Search size={14} /> },
    { value: 'quran', label: 'Quran', icon: <BookOpen size={14} /> },
    { value: 'tafsir', label: 'Tafsir', icon: <BookMarked size={14} /> },
    { value: 'hadith', label: 'Hadis', icon: <ScrollText size={14} /> },
];

// Detail view state types
type DetailView =
    | { type: 'verse'; surah: number; ayah: number }
    | { type: 'tafsir'; surah: number; ayah: number; source: TafsirSource }
    | { type: 'hadith'; collection: HadithCollection; number: number }
    | null;

export function Spotlight({ isOpen, onClose }: SpotlightProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [detailView, setDetailView] = useState<DetailView>(null);

    // Unified search hook
    const {
        query,
        mode,
        scope,
        results,
        isLoading,
        error,
        selectedIndex,
        setQuery,
        setScope,
        selectPrevious,
        selectNext,
        getSelectedResult,
        getFlatResults,
        getTotalCount,
        clearSearch,
    } = useUnifiedSearch();

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        clearSearch();
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 150);
    };

    // Handle opening detail view based on result type
    const handleOpenResult = () => {
        const selected = getSelectedResult();
        if (!selected) return;

        if (selected.type === 'quran') {
            setDetailView({
                type: 'verse',
                surah: selected.data.surah.number,
                ayah: selected.data.ayah,
            });
        } else if (selected.type === 'tafsir') {
            setDetailView({
                type: 'tafsir',
                surah: selected.data.surah.number,
                ayah: selected.data.ayah,
                source: selected.data.source,
            });
        } else if (selected.type === 'hadith') {
            setDetailView({
                type: 'hadith',
                collection: selected.data.collection,
                number: selected.data.number,
            });
        }
    };

    // Handle result item click
    const handleQuranClick = (result: SearchResult) => {
        setDetailView({ type: 'verse', surah: result.surah.number, ayah: result.ayah });
    };

    // Handle verse navigation
    const handleVerseNavigation = (surah: number, ayah: number) => {
        setDetailView({ type: 'verse', surah, ayah });
    };

    const handleTafsirClick = (result: TafsirSearchResult) => {
        setDetailView({ type: 'tafsir', surah: result.surah.number, ayah: result.ayah, source: result.source });
    };

    const handleHadithClick = (result: HadithSearchResult) => {
        setDetailView({ type: 'hadith', collection: result.collection, number: result.number });
    };

    // Handle copy (for Quran results)
    const handleCopy = async (result: SearchResult) => {
        const text = `${result.surah.englishName} ${result.surah.number}:${result.ayah}\n\n${result.text.arabic}\n\n${result.text.indonesian}`;
        await navigator.clipboard.writeText(text);
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onOpen: () => { },
        onClose: handleClose,
        onUp: selectPrevious,
        onDown: selectNext,
        onEnter: handleOpenResult,
        isOpen,
    });

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Listen for custom events from Browse Mode
    useEffect(() => {
        const handleOpenTafsir = (e: CustomEvent<{ surah: number, ayah: number }>) => {
            setDetailView({ type: 'tafsir', surah: e.detail.surah, ayah: e.detail.ayah, source: 'kemenag' });
        };
        const handleSearchRelated = (e: CustomEvent<{ keyword: string }>) => {
            setQuery(e.detail.keyword);
            setScope('hadith');
        };

        window.addEventListener('open-tafsir-from-browse', handleOpenTafsir as EventListener);
        window.addEventListener('search-related-from-browse', handleSearchRelated as EventListener);

        return () => {
            window.removeEventListener('open-tafsir-from-browse', handleOpenTafsir as EventListener);
            window.removeEventListener('search-related-from-browse', handleSearchRelated as EventListener);
        };
    }, [setQuery, setScope]);

    if (!isOpen && !isClosing) return null;

    const flatResults = getFlatResults();
    const totalCount = getTotalCount();

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-custom z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
                <div
                    className={`
                        w-full max-w-2xl bg-surface-50 rounded-2xl shadow-2xl shadow-black/50
                        border border-surface-200 overflow-hidden
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200">
                        <Search className="text-accent shrink-0" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari Al-Quran, Tafsir, atau Hadis..."
                            className="flex-1 bg-transparent text-white text-lg placeholder:text-gray-500 outline-none"
                        />
                        {isLoading && <Loader2 className="text-accent animate-spin shrink-0" size={20} />}
                        {query && !isLoading && (
                            <button
                                onClick={() => setQuery('')}
                                className="px-2 py-1 text-xs rounded bg-surface-200 hover:bg-surface-300 text-gray-400 hover:text-white transition-colors"
                                title="Bersihkan teks"
                            >
                                Hapus
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-white transition-colors"
                            title="Tutup (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scope Toggle */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-100 bg-surface overflow-x-auto">
                        <span className="text-xs text-gray-500 shrink-0">Cakupan:</span>
                        <div className="flex gap-1">
                            {SCOPE_CONFIG.map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    onClick={() => setScope(value)}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-all
                                        ${scope === value
                                            ? 'bg-accent text-white'
                                            : 'bg-surface-200 text-gray-400 hover:text-white'
                                        }
                                    `}
                                >
                                    {icon}
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1" />
                        {/* Search mode indicator */}
                        <div className="flex items-center gap-1 shrink-0">
                            <span className="px-2 py-1 text-xs rounded bg-surface-300 text-white">
                                ID
                            </span>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[50vh] overflow-y-auto">
                        {/* Empty state */}
                        {!query && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <BookOpen size={40} className="mb-3 opacity-50" />
                                <p className="text-sm">Ketik kata kunci untuk mencari</p>
                                <p className="text-xs text-gray-600 mt-1">Quran • Tafsir • Hadis</p>
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {query && isLoading && totalCount === 0 && (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="skeleton h-4 w-32 rounded" />
                                        <div className="skeleton h-8 rounded" />
                                        <div className="skeleton h-4 w-3/4 rounded" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 text-red-400">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Grouped Results */}
                        {!isLoading && totalCount > 0 && (
                            <div>
                                {/* Quran Results */}
                                {results.quran.length > 0 && (scope === 'all' || scope === 'quran') && (
                                    <div>
                                        {scope === 'all' && (
                                            <div className="px-4 py-2 bg-surface text-xs text-accent font-medium flex items-center gap-2 sticky top-0 z-10">
                                                <BookOpen size={14} />
                                                Al-Quran ({results.quran.length})
                                            </div>
                                        )}
                                        {results.quran.map((result) => {
                                            const flatIndex = flatResults.findIndex(
                                                r => r.type === 'quran' && r.data === result
                                            );
                                            return (
                                                <ResultItem
                                                    key={`quran-${result.surah.number}:${result.ayah}`}
                                                    result={result}
                                                    query={query}
                                                    mode={mode}
                                                    isSelected={flatIndex === selectedIndex}
                                                    onSelect={() => handleQuranClick(result)}
                                                    onCopy={() => handleCopy(result)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Tafsir Results */}
                                {results.tafsir.length > 0 && (scope === 'all' || scope === 'tafsir') && (
                                    <div>
                                        {scope === 'all' && (
                                            <div className="px-4 py-2 bg-surface text-xs text-amber-400 font-medium flex items-center gap-2 sticky top-0 z-10">
                                                <BookMarked size={14} />
                                                Tafsir ({results.tafsir.length})
                                            </div>
                                        )}
                                        {results.tafsir.map((result) => {
                                            const flatIndex = flatResults.findIndex(
                                                r => r.type === 'tafsir' && r.data === result
                                            );
                                            return (
                                                <TafsirResultItem
                                                    key={`tafsir-${result.surah.number}:${result.ayah}-${result.source}`}
                                                    result={result}
                                                    query={query}
                                                    isSelected={flatIndex === selectedIndex}
                                                    onSelect={() => handleTafsirClick(result)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Hadith Results */}
                                {results.hadith.length > 0 && (scope === 'all' || scope === 'hadith') && (
                                    <div>
                                        {scope === 'all' && (
                                            <div className="px-4 py-2 bg-surface text-xs text-emerald-400 font-medium flex items-center gap-2 sticky top-0 z-10">
                                                <ScrollText size={14} />
                                                Hadis ({results.hadith.length})
                                            </div>
                                        )}
                                        {results.hadith.map((result) => {
                                            const flatIndex = flatResults.findIndex(
                                                r => r.type === 'hadith' && r.data === result
                                            );
                                            return (
                                                <HadithResultItem
                                                    key={`hadith-${result.id}`}
                                                    result={result}
                                                    query={query}
                                                    isSelected={flatIndex === selectedIndex}
                                                    onSelect={() => handleHadithClick(result)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No results */}
                        {query && !isLoading && totalCount === 0 && !error && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <Search size={40} className="mb-3 opacity-30" />
                                <p className="text-sm">Tidak ada hasil untuk "{query}"</p>
                                <p className="text-xs mt-1">Coba kata kunci lain atau ubah cakupan pencarian</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {totalCount > 0 && (
                        <div className="px-4 py-2 border-t border-surface-200 bg-surface flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                {totalCount} hasil ditemukan
                            </p>
                            <p className="text-xs text-gray-600">
                                ↑↓ navigasi • ⏎ buka
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Drawers */}
            {detailView?.type === 'verse' && (
                <VerseDrawer
                    surah={detailView.surah}
                    ayah={detailView.ayah}
                    isOpen={true}
                    onClose={() => setDetailView(null)}
                    onNavigate={handleVerseNavigation}
                    onOpenTafsir={(surah, ayah) => {
                        setDetailView({ type: 'tafsir', surah, ayah, source: 'kemenag' });
                    }}
                    onSearchRelated={(keyword) => {
                        setDetailView(null);
                        setQuery(keyword);
                        setScope('hadith');
                    }}
                />
            )}

            {detailView?.type === 'tafsir' && (
                <TafsirDrawer
                    surah={detailView.surah}
                    ayah={detailView.ayah}
                    source={detailView.source}
                    isOpen={true}
                    onClose={() => setDetailView(null)}
                />
            )}

            {detailView?.type === 'hadith' && (
                <HadithDrawer
                    collection={detailView.collection}
                    number={detailView.number}
                    isOpen={true}
                    onClose={() => setDetailView(null)}
                />
            )}
        </>
    );
}
