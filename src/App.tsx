/**
 * Al-Quran Suite
 * Main Application Component
 */
import { useState, useEffect } from 'react';
import { Search, Command, WifiOff, BookOpen, LibraryBig, Sparkles } from 'lucide-react';
import { Spotlight, BrowseModal, VerseDrawer, FullSurahModal, TasbihModal } from '@/components';
import { getProviderInfo } from '@/services';

function App() {
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
    const [isBrowseOpen, setIsBrowseOpen] = useState(false);
    const [isTasbihOpen, setIsTasbihOpen] = useState(false);
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

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            {/* Offline notice */}
            {!isOnline && (
                <div className="bg-yellow-900/80 text-yellow-200 px-4 py-2 flex items-center justify-center gap-2 text-sm">
                    <WifiOff size={16} />
                    <span>Anda sedang offline. Beberapa fitur mungkin tidak tersedia.</span>
                </div>
            )}

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-4">
                {/* Logo/Title */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-dark mb-6 shadow-lg shadow-accent/20">
                        <BookOpen size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">
                        Al-Quran Suite
                    </h1>
                    <p className="text-gray-400 max-w-md">
                        Cari dan telusuri ayat Al-Quran, Tafsir, dan Hadis dengan terjemahan Bahasa Indonesia
                    </p>
                </div>

                {/* Main Action Buttons */}
                <div className="w-full max-w-lg space-y-3 sm:space-y-4">
                    {/* Search Trigger Button */}
                    <button
                        onClick={() => setIsSpotlightOpen(true)}
                        className="
                group flex items-center gap-3 px-6 py-4 
                bg-surface-50 hover:bg-surface-100 
                border border-surface-200 hover:border-accent/50
                rounded-2xl shadow-xl shadow-black/20 
                transition-all duration-300 hover:shadow-accent/10
                w-full
              "
                    >
                        <Search className="text-gray-500 group-hover:text-accent transition-colors" size={20} />
                        <span className="flex-1 text-left text-gray-500">
                            Cari ayat Al-Quran...
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-600 bg-surface-200 px-2 py-1 rounded-md">
                            <Command size={12} />
                            <span>K</span>
                        </div>
                    </button>

                    {/* Mode Jelajah & Tasbih Digital Action Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Browse Mode Button */}
                        <button
                            onClick={() => setIsBrowseOpen(true)}
                            className="
                    group flex items-center gap-3 px-5 py-4 
                    bg-surface-50 hover:bg-surface-100 
                    border border-surface-200 hover:border-accent/50
                    rounded-2xl shadow-xl shadow-black/20 
                    transition-all duration-300 hover:shadow-accent/10
                    w-full
                  "
                        >
                            <LibraryBig className="text-gray-500 group-hover:text-accent transition-colors" size={20} />
                            <span className="flex-1 text-left text-sm text-gray-400 group-hover:text-white transition-colors">
                                Mode Jelajah
                            </span>
                        </button>

                        {/* Tasbih Digital Button */}
                        <button
                            onClick={() => setIsTasbihOpen(true)}
                            className="
                    group flex items-center gap-3 px-5 py-4 
                    bg-surface-50 hover:bg-surface-100 
                    border border-surface-200 hover:border-gold/50
                    rounded-2xl shadow-xl shadow-black/20 
                    transition-all duration-300 hover:shadow-gold/10
                    w-full
                  "
                        >
                            <Sparkles className="text-gold group-hover:scale-110 transition-transform" size={20} />
                            <span className="flex-1 text-left text-sm text-gray-400 group-hover:text-white transition-colors">
                                Tasbih Digital
                            </span>
                        </button>
                    </div>
                </div>

                {/* Quick tips */}
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    {['sabar', 'taqwa', 'sholat', 'puasa', 'zakat'].map((keyword) => (
                        <button
                            key={keyword}
                            onClick={() => {
                                setIsSpotlightOpen(true);
                                // We'd need to pass the keyword to Spotlight here for auto-search
                            }}
                            className="
                px-4 py-2 text-sm text-gray-500 
                bg-surface-50 hover:bg-surface-100 
                rounded-full border border-surface-200
                transition-colors hover:text-accent hover:border-accent/30
              "
                        >
                            {keyword}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer with Attribution */}
            <footer className="py-6 text-center text-sm text-gray-600">
                <p className="mb-2">
                    Powered by {providerInfo.search} • {providerInfo.verse}
                </p>
                <div className="text-xs text-gray-700 space-y-1">
                    <p>
                        Tekan <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-gray-500">⌘K</kbd> atau <kbd className="px-1.5 py-0.5 bg-surface-100 rounded text-gray-500">Ctrl+K</kbd> kapan saja untuk mencari
                    </p>
                    <p className="text-gray-500 mt-2">
                        Data: <a href="https://quran.kemenag.go.id" className="hover:text-accent">Kemenag RI</a> •
                        <a href="https://tanzil.net" className="hover:text-accent ml-1">Tanzil.net</a> •
                        <a href="https://api.hadith.gading.dev" className="hover:text-accent ml-1">Hadith API</a>
                    </p>
                    <p className="text-gray-600 text-[10px]">
                        Tafsir Ibn Katsir (CC BY-NC-SA) • Tafsir Jalalayn (CC BY-NC-ND) • Hadith API (MIT)
                    </p>
                </div>
            </footer>

            {/* Spotlight Modal */}
            <Spotlight
                isOpen={isSpotlightOpen}
                onClose={() => setIsSpotlightOpen(false)}
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
                    onSearchRelated={(keyword) => {
                        setBrowseVerse(null);
                        setFullSurahNumber(null);
                        setIsSpotlightOpen(true);
                        window.dispatchEvent(new CustomEvent('search-related-from-browse', { detail: { keyword } }));
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
                />
            )}

            {/* Tasbih Digital Modal */}
            <TasbihModal
                isOpen={isTasbihOpen}
                onClose={() => setIsTasbihOpen(false)}
            />

            {/* Decorative elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {/* Gradient orbs */}
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
            </div>
        </div>
    );
}

export default App;
