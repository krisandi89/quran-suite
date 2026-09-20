/**
 * Tafsir Detail Drawer
 * Slides in from right with full tafsir information
 */
import { useEffect, useState } from 'react';
import { X, Copy, Check, BookMarked, BookOpenText } from 'lucide-react';
import { getTafsir, getVerseDetail } from '@/services';
import type { TafsirEntry, TafsirSource, VerseDetail } from '@/types';

interface TafsirDrawerProps {
    surah: number;
    ayah: number;
    source: TafsirSource;
    isOpen: boolean;
    onClose: () => void;
    onBackToMushaf?: () => void;
}

// Tafsir source display names
const SOURCE_NAMES: Record<TafsirSource, string> = {
    kemenag: 'Tafsir Kemenag',
    ibn_katsir: 'Tafsir Ibn Katsir',
    jalalayn: 'Tafsir al-Jalalayn',
};

export function TafsirDrawer({ surah, ayah, source, isOpen, onClose, onBackToMushaf }: TafsirDrawerProps) {
    const [tafsir, setTafsir] = useState<TafsirEntry | null>(null);
    const [verse, setVerse] = useState<VerseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Fetch tafsir and verse detail
    useEffect(() => {
        if (!isOpen) return;

        const controller = new AbortController();
        setIsLoading(true);
        setError(null);

        Promise.all([
            getTafsir(surah, ayah, source, controller.signal),
            getVerseDetail(surah, ayah, controller.signal),
        ])
            .then(([tafsirData, verseData]) => {
                setTafsir(tafsirData);
                setVerse(verseData);
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                }
            })
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [surah, ayah, source, isOpen]);

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    // Copy tafsir to clipboard
    const handleCopy = async () => {
        if (!tafsir || !verse) return;

        const text = `${SOURCE_NAMES[source]}\n${verse.surahEnglishName} ${surah}:${ayah}\n\n${verse.arabic}\n\n${verse.indonesian}\n\n--- Tafsir ---\n\n${tafsir.text}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Center Peek Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div
                    className={`
                        w-full max-w-3xl h-[85vh] bg-white rounded-2xl shadow-2xl
                        border border-[#E6DFD3] flex flex-col overflow-hidden
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <BookMarked size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white">
                                    {SOURCE_NAMES[source]}
                                </h2>
                                <p className="text-xs text-white/90">
                                    {verse?.surahEnglishName || `Surah ${surah}`}, Ayat {ayah}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onBackToMushaf && (
                                <button
                                    onClick={() => {
                                        handleClose();
                                        onBackToMushaf();
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors text-xs sm:text-sm font-semibold shadow-xs"
                                    title="Kembali ke Mushaf Madinah"
                                >
                                    <BookOpenText size={17} />
                                    <span>Kembali ke Mushaf</span>
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
                                title="Tutup"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
                    {isLoading && (
                        <div className="space-y-4">
                            <div className="skeleton h-24 rounded-lg" />
                            <div className="skeleton h-16 rounded-lg" />
                            <div className="skeleton h-32 rounded-lg" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-500 font-medium">{error}</p>
                        </div>
                    )}

                    {verse && !isLoading && (
                        <div className="space-y-6">
                            {/* Quran Verse */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Ayat Al-Quran
                                </h3>
                                <div className="p-5 sm:p-6 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl shadow-xs">
                                    <p className="arabic-text text-2xl sm:text-3xl text-gray-900 leading-loose text-right">
                                        {verse.arabic}
                                    </p>
                                </div>
                                <div className="bg-[#FAF8F5] border border-[#E6DFD3] p-4 rounded-xl">
                                    <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                                        {verse.indonesian}
                                    </p>
                                </div>
                            </div>

                            {/* Tafsir */}
                            {tafsir ? (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                                        Penjelasan Tafsir ({SOURCE_NAMES[source]})
                                    </h3>
                                    <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200">
                                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                                            {tafsir.text}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-[#FAF8F5] border border-[#E6DFD3] rounded-xl text-center">
                                    <p className="text-gray-500 text-sm">
                                        Tafsir tidak tersedia untuk ayat ini
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {verse && tafsir && (
                    <div className="p-4 border-t border-[#E6DFD3] bg-[#FBF9F5] flex gap-3">
                        {onBackToMushaf && (
                            <button
                                onClick={() => {
                                    handleClose();
                                    onBackToMushaf();
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99]"
                            >
                                <BookOpenText size={18} />
                                <span>Kembali ke Mushaf</span>
                            </button>
                        )}
                        <button
                            onClick={handleCopy}
                            className={`
                                ${onBackToMushaf ? 'px-5' : 'flex-1'} flex items-center justify-center gap-2 py-2.5 rounded-xl
                                font-medium transition-all text-sm
                                ${copied
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white border border-[#E6DFD3] text-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Tersalin!' : 'Salin Tafsir'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </>
);
}
