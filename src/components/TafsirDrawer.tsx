/**
 * Tafsir Detail Drawer
 * Slides in from right with full tafsir information
 */
import { useEffect, useState } from 'react';
import { X, Copy, Check, BookMarked } from 'lucide-react';
import { getTafsir, getVerseDetail } from '@/services';
import type { TafsirEntry, TafsirSource, VerseDetail } from '@/types';

interface TafsirDrawerProps {
    surah: number;
    ayah: number;
    source: TafsirSource;
    isOpen: boolean;
    onClose: () => void;
}

// Tafsir source display names
const SOURCE_NAMES: Record<TafsirSource, string> = {
    kemenag: 'Tafsir Kemenag',
    ibn_katsir: 'Tafsir Ibn Katsir',
    jalalayn: 'Tafsir al-Jalalayn',
};

export function TafsirDrawer({ surah, ayah, source, isOpen, onClose }: TafsirDrawerProps) {
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
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Center Peek Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div
                    className={`
                        w-full max-w-3xl h-[85vh] bg-surface-50 rounded-2xl shadow-2xl shadow-black/50
                        border border-surface-200 flex flex-col overflow-hidden
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <BookMarked size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {SOURCE_NAMES[source]}
                                </h2>
                                <p className="text-sm text-white/80">
                                    {verse?.surahEnglishName || `Surah ${surah}`}, Ayat {ayah}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="space-y-4">
                            <div className="skeleton h-24 rounded-lg" />
                            <div className="skeleton h-16 rounded-lg" />
                            <div className="skeleton h-32 rounded-lg" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {verse && !isLoading && (
                        <div className="space-y-6">
                            {/* Quran Verse */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">
                                    Ayat Al-Quran
                                </h3>
                                <div className="p-4 bg-surface-100 rounded-xl">
                                    <p className="arabic-text text-xl text-white leading-loose text-right">
                                        {verse.arabic}
                                    </p>
                                </div>
                                <p className="mt-3 text-gray-300 leading-relaxed">
                                    {verse.indonesian}
                                </p>
                            </div>

                            {/* Tafsir */}
                            {tafsir ? (
                                <div>
                                    <h3 className="text-sm font-medium text-amber-400 mb-2">
                                        {SOURCE_NAMES[source]}
                                    </h3>
                                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {tafsir.text}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-surface-100 rounded-xl text-center">
                                    <p className="text-gray-500">
                                        Tafsir tidak tersedia untuk ayat ini
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {verse && tafsir && (
                    <div className="p-4 border-t border-surface-200 flex gap-3">
                        <button
                            onClick={handleCopy}
                            className={`
                                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                                font-medium transition-all
                                ${copied
                                    ? 'bg-accent text-white'
                                    : 'bg-surface-200 text-gray-300 hover:bg-surface-300'
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
