/**
 * Mushaf Madinah Viewer
 * Full-page Quran viewer displaying Mushaf Madinah images (604 pages)
 * Features: light/dark mode toggle, dual-page desktop, surah/juz navigation,
 * bookmark persistence, zoom, and integration with existing verse detail view.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    X, ChevronLeft, ChevronRight, BookOpen, Sun, Moon,
    ZoomIn, ZoomOut, Bookmark, BookMarked, ChevronDown,
    Loader2, ArrowUp, Columns2, Smartphone, Info, ExternalLink
} from 'lucide-react';
import {
    SURAH_START_PAGE, JUZ_START_PAGE, TOTAL_MUSHAF_PAGES,
    getMushafPageUrl, getSurahsOnPage, getJuzForPage
} from '@/data/mushafData';
import { SURAH_INFO } from '@/data/surahData';

interface MushafViewerProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSurah?: (surahNumber: number) => void;
}

const BOOKMARK_KEY = 'mushaf-bookmark-page';

export function MushafViewer({ isOpen, onClose, onOpenSurah }: MushafViewerProps) {
    // Core state
    const [currentPage, setCurrentPage] = useState(1);
    const [isClosing, setIsClosing] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDualPage, setIsDualPage] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Navigation dropdowns
    const [showSurahNav, setShowSurahNav] = useState(false);
    const [showJuzNav, setShowJuzNav] = useState(false);
    const [jumpPageInput, setJumpPageInput] = useState('');

    // Image loading
    const [pageLoaded, setPageLoaded] = useState<Record<number, boolean>>({});
    const [pageError, setPageError] = useState<Record<number, boolean>>({});

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const surahNavRef = useRef<HTMLDivElement>(null);
    const juzNavRef = useRef<HTMLDivElement>(null);

    // Load bookmark on open
    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem(BOOKMARK_KEY);
            if (saved) {
                const page = parseInt(saved, 10);
                if (page >= 1 && page <= TOTAL_MUSHAF_PAGES) {
                    setCurrentPage(page);
                    setIsBookmarked(true);
                }
            }
            // Detect screen width for dual page
            setIsDualPage(window.innerWidth >= 1024);
        }
    }, [isOpen]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (surahNavRef.current && !surahNavRef.current.contains(e.target as Node)) {
                setShowSurahNav(false);
            }
            if (juzNavRef.current && !juzNavRef.current.contains(e.target as Node)) {
                setShowJuzNav(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                // RTL: Right arrow = previous, Left arrow = next
                if (e.key === 'ArrowRight') goToPrevPage();
                else goToNextPage();
            } else if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentPage, isDualPage]);

    // Navigation helpers
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= TOTAL_MUSHAF_PAGES) {
            setCurrentPage(page);
            setZoomLevel(1);
            containerRef.current?.scrollTo({ top: 0 });
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

    const handleJumpPage = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(jumpPageInput, 10);
        if (!isNaN(page)) {
            goToPage(page);
            setJumpPageInput('');
        }
    };

    const handleBookmark = () => {
        if (isBookmarked) {
            localStorage.removeItem(BOOKMARK_KEY);
            setIsBookmarked(false);
        } else {
            localStorage.setItem(BOOKMARK_KEY, currentPage.toString());
            setIsBookmarked(true);
        }
    };

    // Auto-save bookmark on page change
    useEffect(() => {
        if (isBookmarked && isOpen) {
            localStorage.setItem(BOOKMARK_KEY, currentPage.toString());
        }
    }, [currentPage, isBookmarked, isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setShowSurahNav(false);
            setShowJuzNav(false);
            setShowInfo(false);
            onClose();
        }, 200);
    };

    const handleImageLoad = (page: number) => {
        setPageLoaded(prev => ({ ...prev, [page]: true }));
        setPageError(prev => ({ ...prev, [page]: false }));
    };

    const handleImageError = (page: number) => {
        setPageError(prev => ({ ...prev, [page]: true }));
        setPageLoaded(prev => ({ ...prev, [page]: false }));
    };

    if (!isOpen && !isClosing) return null;

    // Current page info
    const surahsOnPage = getSurahsOnPage(currentPage);
    const juzNumber = getJuzForPage(currentPage);
    const pageLabel = surahsOnPage.map(s => s.name).join(' • ');

    // Theme colors
    const theme = isDarkMode ? {
        bg: 'bg-[#1a1a1a]',
        header: 'bg-[#252525]',
        border: 'border-[#3a3a3a]',
        text: 'text-gray-200',
        textMuted: 'text-gray-400',
        textDim: 'text-gray-500',
        accent: 'text-emerald-400',
        accentBg: 'bg-emerald-600',
        accentBgHover: 'hover:bg-emerald-700',
        btnBg: 'bg-[#2f2f2f]',
        btnHover: 'hover:bg-[#3a3a3a]',
        pageBg: 'bg-[#222]',
        dropdownBg: 'bg-[#2a2a2a]',
        dropdownHover: 'hover:bg-[#3a3a3a]',
        infoBg: 'bg-[#2a2a2a]',
        skeleton: 'bg-[#2f2f2f]',
        shadow: 'shadow-black/40',
        imgFilter: 'invert brightness-[0.85] hue-rotate-180',
    } : {
        bg: 'bg-[#F5F0E8]',
        header: 'bg-[#FDFBF7]',
        border: 'border-[#E8DFD0]',
        text: 'text-[#3D2E1F]',
        textMuted: 'text-[#7A6B5D]',
        textDim: 'text-[#A09080]',
        accent: 'text-[#1B6B4A]',
        accentBg: 'bg-[#1B6B4A]',
        accentBgHover: 'hover:bg-[#155A3E]',
        btnBg: 'bg-[#EDE7DB]',
        btnHover: 'hover:bg-[#E0D8CA]',
        pageBg: 'bg-white',
        dropdownBg: 'bg-[#FDFBF7]',
        dropdownHover: 'hover:bg-[#F0EBE0]',
        infoBg: 'bg-[#FDFBF7]',
        skeleton: 'bg-[#E8DFD0]',
        shadow: 'shadow-black/10',
        imgFilter: '',
    };

    // Render a single mushaf page image
    const renderPage = (page: number) => {
        if (page < 1 || page > TOTAL_MUSHAF_PAGES) return null;
        const loaded = pageLoaded[page];
        const error = pageError[page];

        return (
            <div
                key={page}
                className={`relative flex items-center justify-center ${theme.pageBg} rounded-lg ${theme.shadow} shadow-lg overflow-hidden`}
                style={{
                    minHeight: isDualPage ? '70vh' : '60vh',
                    maxHeight: '85vh',
                }}
            >
                {/* Loading skeleton */}
                {!loaded && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 size={32} className={`animate-spin ${theme.textDim}`} />
                        <span className={`text-sm ${theme.textDim}`}>Memuat halaman {page}...</span>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <BookOpen size={32} className={theme.textDim} />
                        <span className={`text-sm ${theme.textDim}`}>Gagal memuat halaman {page}</span>
                        <button
                            onClick={() => {
                                setPageError(prev => ({ ...prev, [page]: false }));
                                setPageLoaded(prev => ({ ...prev, [page]: false }));
                            }}
                            className={`px-3 py-1.5 text-xs rounded-lg ${theme.accentBg} text-white ${theme.accentBgHover} transition-colors`}
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Actual image */}
                <img
                    src={getMushafPageUrl(page)}
                    alt={`Mushaf Madinah - Halaman ${page}`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(page)}
                    onError={() => handleImageError(page)}
                    className={`
                        w-full h-full object-contain transition-all duration-300
                        ${loaded ? 'opacity-100' : 'opacity-0'}
                        ${theme.imgFilter}
                    `}
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        maxHeight: '85vh',
                    }}
                    draggable={false}
                />

                {/* Page number badge */}
                <div className={`absolute bottom-2 ${page % 2 === 0 ? 'left-2' : 'right-2'} px-2 py-1 rounded-md text-xs ${theme.btnBg} ${theme.textMuted} opacity-70`}>
                    {page}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3">
                <div
                    className={`
                        w-full h-full sm:max-w-[95vw] sm:h-[97vh] sm:rounded-2xl 
                        ${theme.bg} ${theme.shadow} shadow-2xl
                        border ${theme.border} flex flex-col overflow-hidden
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ===== HEADER ===== */}
                    <div className={`flex items-center justify-between px-3 sm:px-5 py-2.5 ${theme.header} border-b ${theme.border} shrink-0`}>
                        {/* Left: Title & page info */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className={`p-1.5 sm:p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/20' : 'bg-[#1B6B4A]/15'}`}>
                                <BookOpen size={18} className={theme.accent} />
                            </div>
                            <div className="min-w-0">
                                <h2 className={`text-sm sm:text-base font-bold ${theme.text} truncate`}>
                                    Mushaf Madinah
                                </h2>
                                <p className={`text-[10px] sm:text-xs ${theme.textMuted} truncate`}>
                                    Hal. {currentPage}{isDualPage && currentPage < TOTAL_MUSHAF_PAGES ? `-${currentPage + 1}` : ''} • {pageLabel} • Juz {juzNumber}
                                </p>
                            </div>
                        </div>

                        {/* Right: Controls */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {/* Dark/Light toggle */}
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.textMuted} transition-colors`}
                                title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
                            >
                                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                            </button>

                            {/* Dual/Single page toggle (only on larger screens) */}
                            <button
                                onClick={() => setIsDualPage(!isDualPage)}
                                className={`hidden md:flex p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.textMuted} transition-colors`}
                                title={isDualPage ? 'Satu Halaman' : 'Dua Halaman'}
                            >
                                {isDualPage ? <Smartphone size={16} /> : <Columns2 size={16} />}
                            </button>

                            {/* Zoom Out */}
                            <button
                                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.15))}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.textMuted} transition-colors`}
                                title="Perkecil"
                                disabled={zoomLevel <= 0.5}
                            >
                                <ZoomOut size={16} />
                            </button>

                            {/* Zoom level indicator */}
                            <span className={`text-[10px] sm:text-xs ${theme.textDim} w-8 text-center hidden sm:inline`}>
                                {Math.round(zoomLevel * 100)}%
                            </span>

                            {/* Zoom In */}
                            <button
                                onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.15))}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.textMuted} transition-colors`}
                                title="Perbesar"
                                disabled={zoomLevel >= 2.5}
                            >
                                <ZoomIn size={16} />
                            </button>

                            {/* Bookmark */}
                            <button
                                onClick={handleBookmark}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} transition-colors ${isBookmarked ? theme.accent : theme.textMuted}`}
                                title={isBookmarked ? 'Hapus Penanda' : 'Tandai Halaman Ini'}
                            >
                                {isBookmarked ? <BookMarked size={16} /> : <Bookmark size={16} />}
                            </button>

                            {/* Info (page details / open surah) */}
                            <button
                                onClick={() => setShowInfo(!showInfo)}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} transition-colors ${showInfo ? theme.accent : theme.textMuted}`}
                                title="Info Halaman & Buka Surah"
                            >
                                <Info size={16} />
                            </button>

                            {/* Close */}
                            <button
                                onClick={handleClose}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.textMuted} transition-colors`}
                                title="Tutup"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ===== NAVIGATION BAR ===== */}
                    <div className={`flex items-center justify-between px-3 sm:px-5 py-2 ${theme.header} border-b ${theme.border} shrink-0 gap-2 flex-wrap`}>
                        {/* Surah dropdown */}
                        <div ref={surahNavRef} className="relative">
                            <button
                                onClick={() => { setShowSurahNav(!showSurahNav); setShowJuzNav(false); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.text} text-xs sm:text-sm transition-colors`}
                            >
                                <BookOpen size={14} />
                                <span className="hidden sm:inline">Surah</span>
                                <ChevronDown size={14} className={`transition-transform ${showSurahNav ? 'rotate-180' : ''}`} />
                            </button>

                            {showSurahNav && (
                                <div className={`absolute top-full left-0 mt-1 w-64 sm:w-72 max-h-80 overflow-y-auto rounded-xl ${theme.dropdownBg} border ${theme.border} ${theme.shadow} shadow-xl z-50 mushaf-scrollbar`}>
                                    {SURAH_INFO.map((s) => (
                                        <button
                                            key={s.number}
                                            onClick={() => {
                                                goToPage(SURAH_START_PAGE[s.number]);
                                                setShowSurahNav(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 ${theme.dropdownHover} transition-colors text-left ${
                                                surahsOnPage.some(sp => sp.surahNumber === s.number)
                                                    ? `${isDarkMode ? 'bg-emerald-900/30' : 'bg-[#1B6B4A]/10'}`
                                                    : ''
                                            }`}
                                        >
                                            <span className={`w-7 h-7 rounded-md ${theme.btnBg} flex items-center justify-center text-xs font-semibold ${theme.textMuted}`}>
                                                {s.number}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm ${theme.text} block truncate`}>
                                                    {s.englishName}
                                                </span>
                                                <span className={`text-[10px] ${theme.textDim}`}>
                                                    Hal. {SURAH_START_PAGE[s.number]} • {s.numberOfAyahs} Ayat
                                                </span>
                                            </div>
                                            <span className={`arabic-text text-base ${theme.textMuted}`}>
                                                {s.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Juz dropdown */}
                        <div ref={juzNavRef} className="relative">
                            <button
                                onClick={() => { setShowJuzNav(!showJuzNav); setShowSurahNav(false); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.text} text-xs sm:text-sm transition-colors`}
                            >
                                <span>Juz {juzNumber}</span>
                                <ChevronDown size={14} className={`transition-transform ${showJuzNav ? 'rotate-180' : ''}`} />
                            </button>

                            {showJuzNav && (
                                <div className={`absolute top-full left-0 mt-1 w-44 max-h-80 overflow-y-auto rounded-xl ${theme.dropdownBg} border ${theme.border} ${theme.shadow} shadow-xl z-50 mushaf-scrollbar`}>
                                    {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                                        <button
                                            key={j}
                                            onClick={() => {
                                                goToPage(JUZ_START_PAGE[j]);
                                                setShowJuzNav(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 ${theme.dropdownHover} transition-colors text-left ${
                                                j === juzNumber
                                                    ? `${isDarkMode ? 'bg-emerald-900/30' : 'bg-[#1B6B4A]/10'}`
                                                    : ''
                                            }`}
                                        >
                                            <span className={`w-7 h-7 rounded-md ${theme.btnBg} flex items-center justify-center text-xs font-semibold ${theme.textMuted}`}>
                                                {j}
                                            </span>
                                            <span className={`text-sm ${theme.text}`}>Juz {j}</span>
                                            <span className={`text-[10px] ${theme.textDim} ml-auto`}>
                                                Hal. {JUZ_START_PAGE[j]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Jump to page */}
                        <form onSubmit={handleJumpPage} className="flex items-center gap-1.5">
                            <input
                                type="number"
                                min={1}
                                max={TOTAL_MUSHAF_PAGES}
                                value={jumpPageInput}
                                onChange={(e) => setJumpPageInput(e.target.value)}
                                placeholder="Hal."
                                className={`w-14 sm:w-16 px-2 py-1.5 rounded-lg ${theme.btnBg} ${theme.text} text-xs sm:text-sm text-center outline-none border ${theme.border} focus:border-emerald-500/50 transition-colors placeholder:${theme.textDim}`}
                            />
                            <button
                                type="submit"
                                className={`px-2.5 py-1.5 rounded-lg ${theme.accentBg} text-white text-xs font-medium ${theme.accentBgHover} transition-colors`}
                            >
                                Go
                            </button>
                        </form>

                        {/* Page navigation arrows */}
                        <div className="flex items-center gap-1.5 ml-auto">
                            <button
                                onClick={goToPrevPage}
                                disabled={currentPage <= 1}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.textMuted} transition-colors disabled:opacity-30`}
                                title="Halaman Sebelumnya (→)"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <span className={`text-xs sm:text-sm ${theme.text} font-medium min-w-[5rem] text-center`}>
                                {currentPage} / {TOTAL_MUSHAF_PAGES}
                            </span>
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage >= TOTAL_MUSHAF_PAGES}
                                className={`p-1.5 sm:p-2 rounded-lg ${theme.btnBg} ${theme.btnHover} ${theme.textMuted} transition-colors disabled:opacity-30`}
                                title="Halaman Berikutnya (←)"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ===== INFO PANEL (Surah detail + open in reader) ===== */}
                    {showInfo && (
                        <div className={`px-3 sm:px-5 py-3 ${theme.infoBg} border-b ${theme.border} shrink-0`}>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-xs font-semibold ${theme.accent}`}>
                                    Surah di halaman ini:
                                </span>
                                {surahsOnPage.map((s) => (
                                    <button
                                        key={s.surahNumber}
                                        onClick={() => {
                                            if (onOpenSurah) {
                                                onOpenSurah(s.surahNumber);
                                                handleClose();
                                            }
                                        }}
                                        className={`
                                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                            ${theme.accentBg} text-white text-xs font-medium
                                            ${theme.accentBgHover} transition-all
                                            shadow-sm hover:shadow-md
                                        `}
                                        title={`Buka ${s.name} di Mode Jelajah`}
                                    >
                                        <ExternalLink size={12} />
                                        <span>{s.surahNumber}. {s.name}</span>
                                    </button>
                                ))}
                                <span className={`text-[10px] ${theme.textDim} ml-1`}>
                                    ← Klik untuk buka di Mode Jelajah
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ===== MUSHAF CONTENT ===== */}
                    <div
                        ref={containerRef}
                        className={`flex-1 overflow-auto p-3 sm:p-6 ${theme.bg} mushaf-scrollbar`}
                        style={{ overscrollBehavior: 'contain' }}
                    >
                        {isDualPage ? (
                            /* Dual page: RTL book layout (right page first, then left) */
                            <div className="flex items-start justify-center gap-2 sm:gap-4 h-full" dir="rtl">
                                <div className="flex-1 max-w-[48%]">
                                    {renderPage(currentPage)}
                                </div>
                                {currentPage + 1 <= TOTAL_MUSHAF_PAGES && (
                                    <div className="flex-1 max-w-[48%]">
                                        {renderPage(currentPage + 1)}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Single page */
                            <div className="flex items-start justify-center h-full">
                                <div className="w-full max-w-2xl">
                                    {renderPage(currentPage)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== FOOTER PROGRESS BAR ===== */}
                    <div className={`px-3 sm:px-5 py-2 ${theme.header} border-t ${theme.border} shrink-0`}>
                        <div className="flex items-center gap-3">
                            {/* Progress bar */}
                            <div className={`flex-1 h-1.5 rounded-full ${theme.btnBg} overflow-hidden`}>
                                <div
                                    className={`h-full rounded-full ${theme.accentBg} transition-all duration-300`}
                                    style={{ width: `${(currentPage / TOTAL_MUSHAF_PAGES) * 100}%` }}
                                />
                            </div>
                            <span className={`text-[10px] ${theme.textDim} shrink-0`}>
                                {Math.round((currentPage / TOTAL_MUSHAF_PAGES) * 100)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll to top FAB */}
            <button
                onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-20 right-6 z-[60] p-3 rounded-full ${theme.accentBg} text-white ${theme.shadow} shadow-xl ${theme.accentBgHover} transition-all opacity-70 hover:opacity-100`}
                title="Kembali ke atas"
            >
                <ArrowUp size={18} />
            </button>
        </>
    );
}
