/**
 * Mushaf Madinah Viewer (KFGQPC 1441H / Tarteel Edition)
 * 
 * Features:
 * - Authentic Madani Mushaf 1441 AH vector SVG dataset (identical to Tarteel)
 * - True 100% viewport fit with zero scroll (Single & Dual Page modes)
 * - Clean Light Theme background (matching Tarteel's crisp white / soft parchment)
 * - Dark mode toggle
 * - Clickable Ayahs & Words: clicking any verse directly opens its detail in Mode Jelajah
 * - Interactive word hover with emerald green highlighting
 * - Header bar: Surah title, Page, Juz, Hizb (exact Tarteel header format)
 * - Navigation: touch swipe, keyboard (ArrowLeft/Right), floating chevron controls, Jump to Page/Surah/Juz
 * - Smart in-memory cache and next/previous page prefetching for instantaneous page turns
 * - Bookmark persistence via localStorage
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    X, ChevronLeft, ChevronRight, Sun, Moon,
    Bookmark, BookMarked, ChevronDown,
    Loader2, Columns2, Smartphone, Search,
    ExternalLink
} from 'lucide-react';
import {
    SURAH_START_PAGE, JUZ_START_PAGE, TOTAL_MUSHAF_PAGES,
    getMushafPageSvgUrl, getSurahsOnPage, getJuzForPage, getHizbForPage
} from '@/data/mushafData';
import { SURAH_INFO } from '@/data/surahData';

interface MushafViewerProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSurah?: (surahNumber: number) => void;
    onSelectAyah?: (surah: number, ayah: number) => void;
}

const BOOKMARK_KEY = 'mushaf-1441-bookmark-page';

// Global memory cache for SVG strings across modal opens
const svgCache = new Map<number, string>();

export function MushafViewer({ isOpen, onClose, onOpenSurah, onSelectAyah }: MushafViewerProps) {
    // Core states
    const [currentPage, setCurrentPage] = useState<number>(() => {
        const saved = localStorage.getItem(BOOKMARK_KEY);
        if (saved) {
            const p = parseInt(saved, 10);
            if (p >= 1 && p <= TOTAL_MUSHAF_PAGES) return p;
        }
        return 1;
    });

    const [isClosing, setIsClosing] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isDualPage, setIsDualPage] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Selected verse preview banner
    const [activeVerse, setActiveVerse] = useState<{ surah: number; ayah: number } | null>(null);

    // Navigation dropdowns
    const [showNavMenu, setShowNavMenu] = useState(false);
    const [navTab, setNavTab] = useState<'surah' | 'juz' | 'page'>('surah');
    const [jumpInput, setJumpInput] = useState('');
    const [surahFilter, setSurahFilter] = useState('');

    // SVG content for current page and secondary page (in dual mode)
    const [svgContent, setSvgContent] = useState<{ [page: number]: string }>({});
    const [loadingPages, setLoadingPages] = useState<{ [page: number]: boolean }>({});
    const [errorPages, setErrorPages] = useState<{ [page: number]: boolean }>({});

    // Touch swipe handling
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    // Check bookmark on mount & page change
    useEffect(() => {
        const saved = localStorage.getItem(BOOKMARK_KEY);
        setIsBookmarked(saved ? parseInt(saved, 10) === currentPage : false);
    }, [currentPage]);

    // Initial check for screen width
    useEffect(() => {
        if (isOpen) {
            setIsDualPage(window.innerWidth >= 1024);
        }
    }, [isOpen]);

    // Fetch an SVG page with caching and prefetching
    const fetchPageSvg = useCallback(async (page: number) => {
        if (page < 1 || page > TOTAL_MUSHAF_PAGES) return;

        // Check cache first
        if (svgCache.has(page)) {
            const cached = svgCache.get(page)!;
            setSvgContent(prev => ({ ...prev, [page]: cached }));
            return;
        }

        setLoadingPages(prev => ({ ...prev, [page]: true }));
        setErrorPages(prev => ({ ...prev, [page]: false }));

        try {
            const url = getMushafPageSvgUrl(page);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();

            // Cache and update
            svgCache.set(page, text);
            setSvgContent(prev => ({ ...prev, [page]: text }));
        } catch {
            setErrorPages(prev => ({ ...prev, [page]: true }));
        } finally {
            setLoadingPages(prev => ({ ...prev, [page]: false }));
        }
    }, []);

    // Load active pages whenever currentPage or isDualPage changes
    useEffect(() => {
        if (!isOpen) return;

        fetchPageSvg(currentPage);
        if (isDualPage && currentPage + 1 <= TOTAL_MUSHAF_PAGES) {
            fetchPageSvg(currentPage + 1);
        }

        // Background prefetch next & previous pages for instant navigation
        const prefetchTargets = isDualPage
            ? [currentPage - 2, currentPage - 1, currentPage + 2, currentPage + 3]
            : [currentPage - 1, currentPage + 1, currentPage + 2];

        prefetchTargets.forEach(p => {
            if (p >= 1 && p <= TOTAL_MUSHAF_PAGES && !svgCache.has(p)) {
                fetch(getMushafPageSvgUrl(p))
                    .then(r => r.ok ? r.text() : null)
                    .then(txt => {
                        if (txt) svgCache.set(p, txt);
                    })
                    .catch(() => {});
            }
        });
    }, [currentPage, isDualPage, isOpen, fetchPageSvg]);

    // Page navigation methods
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= TOTAL_MUSHAF_PAGES) {
            setCurrentPage(page);
            setActiveVerse(null);
        }
    }, []);

    const goToNextPage = useCallback(() => {
        const step = isDualPage ? 2 : 1;
        goToPage(Math.min(currentPage + step, TOTAL_MUSHAF_PAGES));
    }, [currentPage, isDualPage, goToPage]);

    const goToPrevPage = useCallback(() => {
        const step = isDualPage ? 2 : 1;
        goToPage(Math.max(currentPage - step, 1));
    }, [currentPage, isDualPage, goToPage]);

    // Keyboard navigation (RTL: ArrowLeft = next page, ArrowRight = previous page)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToNextPage();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToPrevPage();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, goToNextPage, goToPrevPage]);

    // Touch swipe handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        // Ensure swipe was horizontal, not vertical scrolling
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
            // RTL swipe: swipe left = next page, swipe right = previous page
            if (deltaX < 0) {
                goToNextPage();
            } else {
                goToPrevPage();
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

    // Bookmark handler
    const handleToggleBookmark = () => {
        if (isBookmarked) {
            localStorage.removeItem(BOOKMARK_KEY);
            setIsBookmarked(false);
        } else {
            localStorage.setItem(BOOKMARK_KEY, currentPage.toString());
            setIsBookmarked(true);
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setShowNavMenu(false);
            setActiveVerse(null);
            onClose();
        }, 180);
    };

    // Click on SVG elements: intercept clicks on words & ayahs
    const handleSvgContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as Element;
        // Search upward for word or ayah group with data-surah and data-aya
        const wordGroup = target.closest('[data-surah][data-aya]');
        if (wordGroup) {
            const surahAttr = wordGroup.getAttribute('data-surah');
            const ayaAttr = wordGroup.getAttribute('data-aya');
            if (surahAttr && ayaAttr) {
                const s = parseInt(surahAttr, 10);
                const a = parseInt(ayaAttr, 10);
                setActiveVerse({ surah: s, ayah: a });
                return;
            }
        }

        // Or search for ayah marker
        const ayaMarkGroup = target.closest('[data-aya]');
        if (ayaMarkGroup) {
            const ayaAttr = ayaMarkGroup.getAttribute('data-aya');
            if (ayaAttr) {
                const a = parseInt(ayaAttr, 10);
                const pageSurahs = getSurahsOnPage(currentPage);
                const s = pageSurahs[0]?.surahNumber || 1;
                setActiveVerse({ surah: s, ayah: a });
            }
        }
    };

    // Open active verse in detail view / Mode Jelajah
    const handleOpenActiveVerse = () => {
        if (!activeVerse) return;
        if (onSelectAyah) {
            handleClose();
            onSelectAyah(activeVerse.surah, activeVerse.ayah);
        } else if (onOpenSurah) {
            handleClose();
            onOpenSurah(activeVerse.surah);
        }
    };

    // Surah metadata for header
    const surahsOnPage = useMemo(() => getSurahsOnPage(currentPage), [currentPage]);
    const primarySurahNumber = surahsOnPage[0]?.surahNumber || 1;
    const primarySurahMeta = SURAH_INFO[primarySurahNumber - 1];
    const juzNumber = getJuzForPage(currentPage);
    const hizbNumber = getHizbForPage(currentPage);

    // Filtered surah list for search dropdown
    const filteredSurahs = useMemo(() => {
        if (!surahFilter.trim()) return SURAH_INFO;
        const q = surahFilter.toLowerCase();
        return SURAH_INFO.filter(s =>
            s.englishName.toLowerCase().includes(q) ||
            s.name.includes(q) ||
            s.number.toString() === q
        );
    }, [surahFilter]);

    if (!isOpen && !isClosing) return null;

    // Theme tokens
    const colors = isDarkMode ? {
        bg: 'bg-[#121212]',
        header: 'bg-[#1a1a1a]',
        border: 'border-[#2e2e2e]',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-400',
        textMuted: 'text-gray-500',
        buttonHover: 'hover:bg-white/10',
        cardBg: 'bg-[#1f1f1f]',
        inputBg: 'bg-[#282828]',
        accent: 'text-emerald-400',
        accentBg: 'bg-emerald-600 hover:bg-emerald-500',
        svgColor: '#e4e4e7',
    } : {
        bg: 'bg-[#FAF8F5]', // Soft warm clean light background (Tarteel aesthetic)
        header: 'bg-white',
        border: 'border-[#EAE5DC]',
        textPrimary: 'text-[#1F1E1D]',
        textSecondary: 'text-[#6B655D]',
        textMuted: 'text-[#9C9488]',
        buttonHover: 'hover:bg-black/5',
        cardBg: 'bg-white',
        inputBg: 'bg-[#F4EFEA]',
        accent: 'text-emerald-700',
        accentBg: 'bg-emerald-700 hover:bg-emerald-800',
        svgColor: '#1a1a1a',
    };

    // Render an individual page SVG
    const renderPageContent = (page: number) => {
        const rawSvg = svgContent[page];
        const isLoading = loadingPages[page];
        const hasError = errorPages[page];

        return (
            <div
                key={page}
                className="relative h-full w-full max-h-full flex items-center justify-center select-none overflow-hidden"
                style={{
                    color: colors.svgColor,
                }}
            >
                {/* Loading state */}
                {isLoading && !rawSvg && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 size={36} className={`animate-spin ${colors.accent}`} />
                        <span className={`text-xs font-medium ${colors.textSecondary}`}>
                            Memuat Mushaf Halaman {page}...
                        </span>
                    </div>
                )}

                {/* Error state */}
                {hasError && !rawSvg && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <p className={`text-sm ${colors.textSecondary}`}>
                            Gagal memuat Halaman {page}
                        </p>
                        <button
                            onClick={() => fetchPageSvg(page)}
                            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg ${colors.accentBg} transition-colors`}
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Inline SVG element with interactive click handlers */}
                {rawSvg && (
                    <div
                        className="mushaf-svg-renderer h-full w-full max-h-full max-w-full flex items-center justify-center transition-opacity duration-200"
                        style={{
                            height: '100%',
                            maxHeight: '100%',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onClick={handleSvgContainerClick}
                        dangerouslySetInnerHTML={{ __html: rawSvg }}
                    />
                )}
            </div>
        );
    };

    return (
        <>
            {/* Fullscreen Modal Backdrop */}
            <div
                className={`fixed inset-0 z-50 flex flex-col ${colors.bg} ${isClosing ? 'opacity-0 scale-98' : 'opacity-100 scale-100'} transition-all duration-200`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* ===== TOP BAR (Tarteel Style: Surah | Page | Juz | Hizb) ===== */}
                <header className={`h-14 shrink-0 px-3 sm:px-6 flex items-center justify-between border-b ${colors.border} ${colors.header} z-20`}>
                    {/* Left: Surah & Location Header (Click to open quick selector) */}
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => setShowNavMenu(!showNavMenu)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${colors.buttonHover} transition-colors text-left group`}
                            title="Buka Menu Navigasi Surah & Juz"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className={`text-sm sm:text-base font-bold ${colors.textPrimary} truncate group-hover:${colors.accent} transition-colors`}>
                                        {primarySurahMeta?.englishName || `Surah ${primarySurahNumber}`}
                                    </h1>
                                    <span className="text-xs sm:text-sm arabic-text font-bold opacity-80 hidden sm:inline">
                                        {primarySurahMeta?.name}
                                    </span>
                                    <ChevronDown size={14} className={`${colors.textMuted} transition-transform ${showNavMenu ? 'rotate-180' : ''}`} />
                                </div>
                                <p className={`text-[11px] sm:text-xs ${colors.textSecondary} font-medium leading-none mt-0.5 truncate`}>
                                    Page {currentPage}{isDualPage && currentPage < TOTAL_MUSHAF_PAGES ? `-${currentPage + 1}` : ''} | Juz {juzNumber} | Hizb {hizbNumber}
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {/* Search / Jump to Page Button */}
                        <button
                            onClick={() => {
                                setShowNavMenu(true);
                                setNavTab('page');
                            }}
                            className={`p-2 rounded-xl ${colors.buttonHover} ${colors.textSecondary} transition-colors`}
                            title="Cari atau Lompat ke Halaman"
                        >
                            <Search size={18} />
                        </button>

                        {/* Dual Page Toggle (Desktop only) */}
                        <button
                            onClick={() => setIsDualPage(!isDualPage)}
                            className={`hidden lg:flex p-2 rounded-xl ${colors.buttonHover} ${isDualPage ? colors.accent : colors.textSecondary} transition-colors`}
                            title={isDualPage ? 'Beralih ke 1 Halaman' : 'Beralih ke 2 Halaman (Buku)'}
                        >
                            {isDualPage ? <Columns2 size={18} /> : <Smartphone size={18} />}
                        </button>

                        {/* Light/Dark Mode Toggle */}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2 rounded-xl ${colors.buttonHover} ${colors.textSecondary} transition-colors`}
                            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Bookmark Button */}
                        <button
                            onClick={handleToggleBookmark}
                            className={`p-2 rounded-xl ${colors.buttonHover} transition-colors ${isBookmarked ? 'text-amber-500' : colors.textSecondary}`}
                            title={isBookmarked ? 'Halaman ini ditandai' : 'Tandai Halaman Ini'}
                        >
                            {isBookmarked ? <BookMarked size={18} /> : <Bookmark size={18} />}
                        </button>

                        {/* Close Viewer */}
                        <button
                            onClick={handleClose}
                            className={`p-2 rounded-xl ${colors.buttonHover} ${colors.textSecondary} hover:${colors.textPrimary} transition-colors ml-1`}
                            title="Tutup Mushaf"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* ===== MAIN STAGE: 100% FIT, ZERO VERTICAL SCROLL ===== */}
                <main className="flex-1 h-full min-h-0 w-full overflow-hidden relative flex items-center justify-center p-1 sm:p-3">
                    {/* Floating Previous Page Chevron (RTL: Right Arrow = Page Before) */}
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage <= 1}
                        className={`
                            absolute right-2 sm:right-4 z-30 p-2.5 sm:p-3 rounded-full 
                            ${colors.cardBg} ${colors.border} border shadow-lg 
                            ${colors.textPrimary} ${colors.buttonHover} transition-all
                            disabled:opacity-20 disabled:pointer-events-none hover:scale-105
                        `}
                        title="Halaman Sebelumnya (→)"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Floating Next Page Chevron (RTL: Left Arrow = Page Next) */}
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage >= TOTAL_MUSHAF_PAGES}
                        className={`
                            absolute left-2 sm:left-4 z-30 p-2.5 sm:p-3 rounded-full 
                            ${colors.cardBg} ${colors.border} border shadow-lg 
                            ${colors.textPrimary} ${colors.buttonHover} transition-all
                            disabled:opacity-20 disabled:pointer-events-none hover:scale-105
                        `}
                        title="Halaman Berikutnya (←)"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Pages Container: Fits exactly 100% height */}
                    <div className="h-full w-full max-h-full max-w-full flex items-center justify-center overflow-hidden">
                        {isDualPage ? (
                            /* Dual page mode: Right-to-Left book orientation (Right page first, then Left page) */
                            <div className="flex flex-row-reverse items-center justify-center gap-4 sm:gap-8 h-full w-full max-h-full max-w-6xl px-8 sm:px-14">
                                <div className="flex-1 h-full max-h-full flex items-center justify-center min-w-0">
                                    {renderPageContent(currentPage)}
                                </div>
                                {currentPage + 1 <= TOTAL_MUSHAF_PAGES && (
                                    <div className="flex-1 h-full max-h-full flex items-center justify-center min-w-0">
                                        {renderPageContent(currentPage + 1)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Single page mode: Center-fitted */
                            <div className="h-full w-full max-h-full max-w-2xl px-6 sm:px-12 flex items-center justify-center">
                                {renderPageContent(currentPage)}
                            </div>
                        )}
                    </div>

                    {/* Active Clicked Verse Action Banner */}
                    {activeVerse && (
                        <div className={`
                            absolute bottom-4 z-40 px-4 py-3 rounded-2xl shadow-2xl border
                            ${colors.cardBg} ${colors.border} flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200
                        `}>
                            <div className="text-left">
                                <span className={`text-xs font-semibold ${colors.accent}`}>
                                    QS. {SURAH_INFO[activeVerse.surah - 1]?.englishName} Ayat {activeVerse.ayah}
                                </span>
                                <p className={`text-[11px] ${colors.textSecondary}`}>
                                    Klik tombol untuk membuka detail ayat, tafsir, & terjemahan lengkap
                                </p>
                            </div>
                            <button
                                onClick={handleOpenActiveVerse}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${colors.accentBg} text-white text-xs font-semibold transition-all shadow-md`}
                            >
                                <span>Buka Tafsir & Mode Jelajah</span>
                                <ExternalLink size={13} />
                            </button>
                            <button
                                onClick={() => setActiveVerse(null)}
                                className={`p-1 rounded-lg ${colors.buttonHover} ${colors.textMuted}`}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </main>

                {/* ===== BOTTOM MINIMAL PROGRESS BAR ===== */}
                <footer className={`h-8 shrink-0 px-4 flex items-center justify-between border-t ${colors.border} ${colors.header} text-[11px] ${colors.textMuted}`}>
                    <span className="hidden sm:inline">
                        Mushaf Madinah 1441H (KFGQPC Vector) • Klik ayat untuk buka tafsir
                    </span>
                    <div className="flex items-center gap-2 flex-1 max-w-xs mx-auto sm:mr-0">
                        <input
                            type="range"
                            min={1}
                            max={TOTAL_MUSHAF_PAGES}
                            value={currentPage}
                            onChange={(e) => goToPage(parseInt(e.target.value, 10))}
                            className="w-full accent-emerald-600 h-1 cursor-pointer"
                        />
                        <span className="font-mono text-xs font-medium shrink-0">
                            {currentPage}/{TOTAL_MUSHAF_PAGES}
                        </span>
                    </div>
                </footer>

                {/* ===== NAVIGATION POPUP (Surah, Juz, Jump to Page) ===== */}
                {showNavMenu && (
                    <div
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
                        onClick={() => setShowNavMenu(false)}
                    >
                        <div
                            className={`w-full max-w-md max-h-[80vh] rounded-2xl ${colors.cardBg} border ${colors.border} shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150`}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className={`p-4 border-b ${colors.border} flex items-center justify-between`}>
                                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                                    <button
                                        onClick={() => setNavTab('surah')}
                                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${navTab === 'surah' ? `${colors.accentBg} text-white` : colors.textSecondary}`}
                                    >
                                        Daftar Surah
                                    </button>
                                    <button
                                        onClick={() => setNavTab('juz')}
                                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${navTab === 'juz' ? `${colors.accentBg} text-white` : colors.textSecondary}`}
                                    >
                                        Daftar Juz
                                    </button>
                                    <button
                                        onClick={() => setNavTab('page')}
                                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${navTab === 'page' ? `${colors.accentBg} text-white` : colors.textSecondary}`}
                                    >
                                        Lompat Halaman
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowNavMenu(false)}
                                    className={`p-1.5 rounded-lg ${colors.buttonHover} ${colors.textSecondary}`}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {navTab === 'surah' && (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Cari surah..."
                                            value={surahFilter}
                                            onChange={e => setSurahFilter(e.target.value)}
                                            className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm ${colors.inputBg} ${colors.textPrimary} outline-none border ${colors.border}`}
                                            autoFocus
                                        />
                                        <div className="space-y-1 max-h-80 overflow-y-auto">
                                            {filteredSurahs.map(s => (
                                                <button
                                                    key={s.number}
                                                    onClick={() => {
                                                        goToPage(SURAH_START_PAGE[s.number]);
                                                        setShowNavMenu(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl ${colors.buttonHover} text-left transition-colors`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-7 h-7 rounded-lg ${colors.inputBg} flex items-center justify-center text-xs font-semibold ${colors.textMuted}`}>
                                                            {s.number}
                                                        </span>
                                                        <div>
                                                            <div className={`text-sm font-semibold ${colors.textPrimary}`}>
                                                                {s.englishName}
                                                            </div>
                                                            <div className={`text-[10px] ${colors.textSecondary}`}>
                                                                Hal. {SURAH_START_PAGE[s.number]} • {s.numberOfAyahs} Ayat
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`arabic-text text-base ${colors.textSecondary}`}>
                                                        {s.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {navTab === 'juz' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                                            <button
                                                key={j}
                                                onClick={() => {
                                                    goToPage(JUZ_START_PAGE[j]);
                                                    setShowNavMenu(false);
                                                }}
                                                className={`p-3 rounded-xl border ${colors.border} ${colors.buttonHover} text-center transition-colors ${j === juzNumber ? 'border-emerald-500 bg-emerald-50/20' : ''}`}
                                            >
                                                <div className={`text-sm font-bold ${colors.textPrimary}`}>
                                                    Juz {j}
                                                </div>
                                                <div className={`text-[11px] ${colors.textSecondary} mt-0.5`}>
                                                    Hal. {JUZ_START_PAGE[j]}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {navTab === 'page' && (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const p = parseInt(jumpInput, 10);
                                            if (!isNaN(p)) {
                                                goToPage(p);
                                                setShowNavMenu(false);
                                                setJumpInput('');
                                            }
                                        }}
                                        className="space-y-4 py-4"
                                    >
                                        <div className="text-center">
                                            <label className={`text-xs ${colors.textSecondary} block mb-2`}>
                                                Masukkan Nomor Halaman (1 - {TOTAL_MUSHAF_PAGES})
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={TOTAL_MUSHAF_PAGES}
                                                value={jumpInput}
                                                onChange={e => setJumpInput(e.target.value)}
                                                placeholder={`Contoh: ${currentPage}`}
                                                className={`w-32 text-center text-2xl font-bold py-2 px-3 rounded-xl ${colors.inputBg} ${colors.textPrimary} outline-none border ${colors.border}`}
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm ${colors.accentBg} transition-all`}
                                        >
                                            Buka Halaman
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Global SVG styling for interactive word & ayah highlights */}
            <style>{`
                .mushaf-svg-renderer svg {
                    width: auto !important;
                    height: 100% !important;
                    max-height: 100% !important;
                    max-width: 100% !important;
                    object-fit: contain;
                    display: block;
                }
                .mushaf-svg-renderer path {
                    fill: currentColor;
                    transition: fill 0.15s ease-out;
                }
                .mushaf-svg-renderer [data-surah][data-aya] {
                    cursor: pointer;
                }
                .mushaf-svg-renderer [data-surah][data-aya]:hover path {
                    fill: #059669 !important;
                }
                .mushaf-svg-renderer [data-aya]:hover path {
                    fill: #059669 !important;
                }
            `}</style>
        </>
    );
}
