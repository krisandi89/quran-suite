/**
 * Al-Quran Suite
 * Main Application Component
 */
import { useState, useEffect } from 'react';
import { Search, Command, WifiOff, BookOpen } from 'lucide-react';
import { Spotlight } from '@/components/Spotlight';
import { getProviderInfo } from '@/services';

function App() {
    const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
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

    // Global keyboard shortcut for Cmd+K
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

                {/* Search Trigger Button */}
                <button
                    onClick={() => setIsSpotlightOpen(true)}
                    className="
            group flex items-center gap-3 px-6 py-4 
            bg-surface-50 hover:bg-surface-100 
            border border-surface-200 hover:border-accent/50
            rounded-2xl shadow-xl shadow-black/20 
            transition-all duration-300 hover:shadow-accent/10
            w-full max-w-lg
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
