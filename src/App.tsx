/**
 * Al-Quran Suite
 * Main Application Component
 */
import { useState, useEffect } from 'react';
import { Search, Command, WifiOff, BookOpen, LibraryBig, Sparkles, BookOpenText } from 'lucide-react';
import { Spotlight, BrowseModal, VerseDrawer, FullSurahModal, TasbihModal, MushafViewer } from '@/components';
import { getProviderInfo } from '@/services';
import { SURAH_START_PAGE, getSurahsOnPage } from '@/data/mushafData';

function App() {
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isBrowseOpen, setIsBrowseOpen] = useState(false);
    const [isTasbihOpen, setIsTasbihOpen] = useState(false);
    const [isMushafOpen, setIsMushafOpen] = useState(false);
    const [mushafPage, setMushafPage] = useState<number>(() => {
        const saved = localStorage.getItem('mushaf-1441-bookmark-page');
        return saved ? parseInt(saved, 10) : 1;
    });
    const [browseVerse, setBrowseVerse] = useState<{ surah: number; ayah: number } | null>(null);
    const [fullSurahNumber, setFullSurahNumber] = useState<number | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const providerInfo = getProviderInfo();

    // Listen for online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Global keyboard shortcut for Cmd+K and 't' for Tasbih when not typing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSpotlightOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handler to safely return to Mushaf Madinah from any view (Tafsir, Verse, Full Surah)
    const handleBackToMushaf = (surah?: number, _ayah?: number, page?: number) => {
        let targetPage = page || mushafPage;
        if (!page && surah) {
            // Check if current mushafPage already contains this surah
            const surahsOnCurrentPage = getSurahsOnPage(mushafPage);
            const hasSurah = surahsOnCurrentPage.some(s => s.surahNumber === surah);
            if (!hasSurah && SURAH_START_PAGE[surah]) {
                targetPage = SURAH_START_PAGE[surah];
            }
        }
        setMushafPage(targetPage);
        setBrowseVerse(null);
        setFullSurahNumber(null);
        setIsSpotlightOpen(false);
        setIsBrowseOpen(false);
        setIsMushafOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#F8F6F0] text-gray-900 flex flex-col">
            {/* Offline notice */}
            {!isOnline && (
                <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
                    <WifiOff size={16} />
                    <span>Anda sedang offline. Beberapa fitur mungkin tidak tersedia.</span>
                </div>
            )}

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                {/* Logo/Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 mb-6 shadow-xl shadow-emerald-700/20">
                        <BookOpen size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
                        Al-Quran Suite
                    </h1>
                    <p className="text-gray-600 max-w-md text-sm sm:text-base leading-relaxed mx-auto">
                        Cari dan telusuri ayat Al-Quran, Tafsir, dan Hadis dengan terjemahan Bahasa Indonesia
                    </p>
                </div>

                {/* Main Action Buttons */}
                <div className="w-full max-w-lg space-y-3 sm:space-y-4">
                    {/* Search Trigger Button */}
                    <button
                        onClick={() => setIsSpotlightOpen(true)}
                        className="
                group flex items-center gap-3.5 px-6 py-4 
                bg-white hover:bg-emerald-50/30 
                border border-[#E6DFD3] hover:border-emerald-500/60
                rounded-2xl shadow-lg shadow-gray-200/50 
                transition-all duration-200 hover:shadow-emerald-500/10
                w-full
              "
                    >
                        <Search className="text-gray-400 group-hover:text-emerald-600 transition-colors" size={20} />
                        <span className="flex-1 text-left text-gray-400 text-base">
                            Cari ayat Al-Quran, tafsir, hadis...
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
                            <Command size={12} />
                            <span>K</span>
                        </div>
                    </button>

                    {/* Mode Jelajah, Mushaf Madinah & Tasbih Digital Action Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {/* Browse Mode Button */}
                        <button
                            onClick={() => setIsBrowseOpen(true)}
                            className="
                    group flex items-center gap-3 px-5 py-4 
                    bg-white hover:bg-emerald-50/40 
                    border border-[#E6DFD3] hover:border-emerald-500/60
                    rounded-2xl shadow-md shadow-gray-200/40 
                    transition-all duration-200 hover:shadow-emerald-500/10
                    w-full
                  "
                        >
                            <LibraryBig className="text-gray-400 group-hover:text-emerald-600 transition-colors" size={20} />
                            <span className="flex-1 text-left text-sm font-semibold text-gray-700 group-hover:text-emerald-800 transition-colors">
                                Mode Jelajah
                            </span>
                        </button>

                        {/* Mushaf Madinah Button */}
                        <button
                            onClick={() => setIsMushafOpen(true)}
                            className="
                    group flex items-center gap-3 px-5 py-4 
                    bg-white hover:bg-emerald-50/50 
                    border border-[#E6DFD3] hover:border-emerald-600
                    rounded-2xl shadow-md shadow-gray-200/40 
                    transition-all duration-200 hover:shadow-emerald-600/15
                    w-full
                  "
                        >
                            <BookOpenText className="text-emerald-600 group-hover:scale-105 transition-transform" size={20} />
                            <span className="flex-1 text-left text-sm font-bold text-emerald-800 group-hover:text-emerald-900 transition-colors">
                                Mushaf Madinah
                            </span>
                        </button>

                        {/* Tasbih Digital Button */}
                        <button
                            onClick={() => setIsTasbihOpen(true)}
                            className="
                    group flex items-center gap-3 px-5 py-4 
                    bg-white hover:bg-amber-50/40 
                    border border-[#E6DFD3] hover:border-amber-500/60
                    rounded-2xl shadow-md shadow-gray-200/40 
                    transition-all duration-200 hover:shadow-amber-500/10
                    w-full
                  "
                        >
                            <Sparkles className="text-amber-600 group-hover:scale-110 transition-transform" size={20} />
                            <span className="flex-1 text-left text-sm font-semibold text-gray-700 group-hover:text-amber-800 transition-colors">
                                Tasbih Digital
                            </span>
                        </button>
                    </div>
                </div>

                {/* Quick tips */}
                <div className="mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
                    {['sabar', 'taqwa', 'sholat', 'puasa', 'zakat'].map((keyword) => (
                        <button
                            key={keyword}
                            onClick={() => {
                                setIsSpotlightOpen(true);
                            }}
                            className="
                px-4 py-1.5 text-xs sm:text-sm font-medium text-gray-600 
                bg-white hover:bg-emerald-50 
                rounded-full border border-[#E6DFD3]
                transition-colors hover:text-emerald-800 hover:border-emerald-400 shadow-2xs
              "
                        >
                            #{keyword}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer with Attribution */}
            <footer className="py-6 text-center text-sm text-gray-600 border-t border-[#E6DFD3] bg-[#FBF9F5]">
                <p className="mb-2 font-medium">
                    Didukung oleh {providerInfo.search} • {providerInfo.verse}
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                    <p>
                        Tekan <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-medium">⌘K</kbd> atau <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-600 font-medium">Ctrl+K</kbd> kapan saja untuk mencari
                    </p>
                    <p className="text-gray-500 mt-2">
                        Data: <a href="https://quran.kemenag.go.id" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">Kemenag RI</a> •
                        <a href="https://tanzil.net" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline ml-1">Tanzil.net</a> •
                        <a href="https://api.hadith.gading.dev" target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline ml-1">Hadith API</a>
                    </p>
                    <p className="text-gray-400 text-[10px]">
                        Tafsir Ibn Katsir (CC BY-NC-SA) • Tafsir Jalalayn (CC BY-NC-ND) • Hadith API (MIT)
                    </p>
                </div>
            </footer>

            {/* Spotlight Modal */}
            <Spotlight
                isOpen={isSpotlightOpen}
                onClose={() => setIsSpotlightOpen(false)}
                onBackToMushaf={(surah, ayah) => handleBackToMushaf(surah, ayah)}
            />

            {/* Browse Modal */}
            <BrowseModal
                isOpen={isBrowseOpen}
                onClose={() => setIsBrowseOpen(false)}
                onSelectSurah={(surahNumber) => {
                    setIsBrowseOpen(false);
                    setFullSurahNumber(surahNumber);
                }}
            />

            {/* Full Surah Reader Modal */}
            {fullSurahNumber !== null && (
                <FullSurahModal
                    surah={fullSurahNumber}
                    isOpen={true}
                    onClose={() => setFullSurahNumber(null)}
                    onSelectAyah={(surah, ayah) => {
                        setBrowseVerse({ surah, ayah });
                    }}
                    onBackToBrowse={() => {
                        setFullSurahNumber(null);
                        setIsBrowseOpen(true);
                    }}
                    onBackToMushaf={(surah) => handleBackToMushaf(surah)}
                />
            )}

            {/* Global Verse Detail Modal (Center Peek) */}
            {browseVerse && (
                <VerseDrawer
                    surah={browseVerse.surah}
                    ayah={browseVerse.ayah}
                    isOpen={true}
                    onClose={() => setBrowseVerse(null)}
                    onNavigate={(surah, ayah) => setBrowseVerse({ surah, ayah })}
                    onOpenTafsir={(surah, ayah) => {
                        setBrowseVerse(null);
                        setFullSurahNumber(null);
                        setIsSpotlightOpen(true);
                        window.dispatchEvent(new CustomEvent('open-tafsir-from-browse', { detail: { surah, ayah } }));
                    }}
                    onSearchRelated={(keyword, surah, ayah) => {
                        setBrowseVerse(null);
                        setFullSurahNumber(null);
                        setIsSpotlightOpen(true);
                        window.dispatchEvent(new CustomEvent('search-related-from-browse', { detail: { keyword, surah, ayah } }));
                    }}
                    onBackToBrowse={() => {
                        setBrowseVerse(null);
                        if (fullSurahNumber) {
                            // If user was reading full surah, go back to full surah view
                        } else {
                            setIsBrowseOpen(true);
                        }
                    }}
                    onOpenFullSurah={(surah) => {
                        setBrowseVerse(null);
                        setFullSurahNumber(surah);
                    }}
                    onBackToMushaf={() => handleBackToMushaf(browseVerse.surah, browseVerse.ayah)}
                />
            )}

            {/* Tasbih Digital Modal */}
            <TasbihModal
                isOpen={isTasbihOpen}
                onClose={() => setIsTasbihOpen(false)}
            />

            {/* Mushaf Madinah Viewer */}
            <MushafViewer
                isOpen={isMushafOpen}
                initialPage={mushafPage}
                onPageChange={setMushafPage}
                onClose={() => setIsMushafOpen(false)}
                onOpenSurah={(surahNumber) => {
                    setIsMushafOpen(false);
                    setFullSurahNumber(surahNumber);
                }}
                onSelectAyah={(surah, ayah) => {
                    setIsMushafOpen(false);
                    setBrowseVerse({ surah, ayah });
                }}
            />

            {/* Decorative elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}

export default App;
