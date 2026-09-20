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
    onBackToMushaf?: (surah?: number, ayah?: number) => void;
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

export function Spotlight({ isOpen, onClose, onBackToMushaf }: SpotlightProps) {
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

    // Track last verse source if arrived from Browse/Mushaf
    const [lastVerseSource, setLastVerseSource] = useState<{ surah?: number; ayah?: number } | null>(null);

    // Listen for custom events from Browse Mode
    useEffect(() => {
        const handleOpenTafsir = (e: CustomEvent<{ surah: number, ayah: number }>) => {
            setLastVerseSource({ surah: e.detail.surah, ayah: e.detail.ayah });
            setDetailView({ type: 'tafsir', surah: e.detail.surah, ayah: e.detail.ayah, source: 'kemenag' });
        };
        const handleSearchRelated = (e: CustomEvent<{ keyword: string; surah?: number; ayah?: number }>) => {
            setQuery(e.detail.keyword);
            setScope('hadith');
            if (e.detail.surah) {
                setLastVerseSource({ surah: e.detail.surah, ayah: e.detail.ayah });
            }
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
                className="fixed inset-0 bg-black/50 backdrop-blur-custom z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
                <div
                    className={`
                        w-full max-w-2xl bg-white rounded-2xl shadow-2xl
                        border border-[#E6DFD3] overflow-hidden
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E6DFD3] bg-white">
                        <Search className="text-emerald-600 shrink-0" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari Al-Quran, Tafsir, atau Hadis..."
                            className="flex-1 bg-transparent text-gray-900 text-lg placeholder:text-gray-400 outline-none"
                        />
                        {isLoading && <Loader2 className="text-emerald-600 animate-spin shrink-0" size={20} />}
                        {query && !isLoading && (
                            <button
                                onClick={() => setQuery('')}
                                className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                                title="Bersihkan teks"
                            >
                                Hapus
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Tutup (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scope Toggle */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E6DFD3] bg-[#FBF9F5] overflow-x-auto">
                        <span className="text-xs text-gray-500 shrink-0">Cakupan:</span>
                        <div className="flex gap-1.5">
                            {SCOPE_CONFIG.map(({ value, label, icon }) => (
                                <button
                                    key={value}
                                    onClick={() => setScope(value)}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1 text-xs rounded-full transition-all
                                        ${scope === value
                                            ? 'bg-emerald-600 text-white font-medium shadow-xs'
                                            : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
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
                            <span className="px-2 py-0.5 text-xs rounded bg-gray-100 border border-gray-200 text-gray-700 font-medium">
                                ID
                            </span>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[50vh] overflow-y-auto bg-white">
                        {/* Empty state */}
                        {!query && (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <BookOpen size={40} className="mb-3 opacity-40 text-gray-500" />
                                <p className="text-sm text-gray-600 font-medium">Ketik kata kunci untuk mencari</p>
                                <p className="text-xs text-gray-400 mt-1">Quran • Tafsir • Hadis</p>
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
                                            <div className="px-4 py-2 bg-[#F8F6F0] text-xs text-emerald-800 font-semibold flex items-center gap-2 sticky top-0 z-10 border-b border-[#E6DFD3]">
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
                                            <div className="px-4 py-2 bg-[#FDF9F0] text-xs text-amber-800 font-semibold flex items-center gap-2 sticky top-0 z-10 border-b border-[#E6DFD3]">
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
                                            <div className="px-4 py-2 bg-[#F0FDF4] text-xs text-emerald-800 font-semibold flex items-center gap-2 sticky top-0 z-10 border-b border-[#E6DFD3]">
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
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Search size={40} className="mb-3 opacity-30 text-gray-500" />
                                <p className="text-sm text-gray-600 font-medium">Tidak ada hasil untuk "{query}"</p>
                                <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau ubah cakupan pencarian</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {totalCount > 0 && (
                        <div className="px-4 py-2 border-t border-[#E6DFD3] bg-[#FBF9F5] flex items-center justify-between">
                            <p className="text-xs text-gray-600 font-medium">
                                {totalCount} hasil ditemukan
                            </p>
                            <p className="text-xs text-gray-500">
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
                    onBackToMushaf={onBackToMushaf ? () => {
                        const targetSurah = detailView.surah;
                        const targetAyah = detailView.ayah;
                        setDetailView(null);
                        handleClose();
                        onBackToMushaf(targetSurah, targetAyah);
                    } : undefined}
                />
            )}

            {detailView?.type === 'tafsir' && (
                <TafsirDrawer
                    surah={detailView.surah}
                    ayah={detailView.ayah}
                    source={detailView.source}
                    isOpen={true}
                    onClose={() => setDetailView(null)}
                    onBackToMushaf={onBackToMushaf ? () => {
                        const targetSurah = detailView.surah;
                        const targetAyah = detailView.ayah;
                        setDetailView(null);
                        handleClose();
                        onBackToMushaf(targetSurah, targetAyah);
                    } : undefined}
                />
            )}

            {detailView?.type === 'hadith' && (
                <HadithDrawer
                    collection={detailView.collection}
                    number={detailView.number}
                    isOpen={true}
                    onClose={() => setDetailView(null)}
                    onBackToMushaf={onBackToMushaf ? () => {
                        const targetSurah = lastVerseSource?.surah;
                        const targetAyah = lastVerseSource?.ayah;
                        setDetailView(null);
                        handleClose();
                        onBackToMushaf(targetSurah, targetAyah);
                    } : undefined}
                />
            )}
        </>
    );
}
