/**
 * Verse Detail Drawer
 * Slides in from right with full verse information
 */
import { useEffect, useState } from 'react';
import { X, Copy, Volume2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { getVerseDetail } from '@/services';
import { SURAH_INFO } from '@/data/surahData';
import type { VerseDetail } from '@/types';

interface VerseDrawerProps {
    surah: number;
    ayah: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (surah: number, ayah: number) => void;
}

export function VerseDrawer({ surah, ayah, isOpen, onClose, onNavigate }: VerseDrawerProps) {
    const [verse, setVerse] = useState<VerseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Fetch verse detail
    useEffect(() => {
        if (!isOpen) return;

        const controller = new AbortController();
        setIsLoading(true);
        setError(null);

        getVerseDetail(surah, ayah, controller.signal)
            .then(setVerse)
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                }
            })
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [surah, ayah, isOpen]);

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    // Copy verse to clipboard
    const handleCopy = async () => {
        if (!verse) return;

        const text = `${verse.surahEnglishName} ${verse.surah}:${verse.ayah}\n\n${verse.arabic}\n\n${verse.indonesian}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={`
          fixed right-0 top-0 h-full w-full max-w-lg bg-surface-50 z-50
          shadow-2xl shadow-black/50 flex flex-col
          ${isClosing ? 'drawer-exit' : 'drawer-enter'}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        {verse && (
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {verse.surahEnglishName}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Surah {verse.surah}, Ayah {verse.ayah}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                if (ayah > 1) {
                                    onNavigate(surah, ayah - 1);
                                } else if (surah > 1) {
                                    const prevSurah = SURAH_INFO[surah - 2];
                                    if (prevSurah) {
                                        onNavigate(surah - 1, prevSurah.numberOfAyahs);
                                    }
                                }
                            }}
                            disabled={surah === 1 && ayah === 1}
                            className="p-2 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Ayat Sebelumnya"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => {
                                const currentSurah = SURAH_INFO[surah - 1];
                                if (currentSurah && ayah < currentSurah.numberOfAyahs) {
                                    onNavigate(surah, ayah + 1);
                                } else if (surah < 114) {
                                    onNavigate(surah + 1, 1);
                                }
                            }}
                            disabled={surah === 114 && ayah === 6}
                            className="p-2 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Ayat Selanjutnya"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading && (
                        <div className="space-y-4">
                            <div className="skeleton h-24 rounded-lg" />
                            <div className="skeleton h-16 rounded-lg" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {verse && !isLoading && (
                        <div className="space-y-6">
                            {/* Arabic */}
                            <div className="p-4 bg-surface-100 rounded-xl">
                                <p className="arabic-text text-2xl text-white leading-loose text-right">
                                    {verse.arabic}
                                </p>
                            </div>

                            {/* Indonesian */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">
                                    Terjemahan Indonesia
                                </h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {verse.indonesian}
                                </p>
                            </div>

                            {/* Audio (if available) */}
                            {verse.audioUrl && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                                        Audio
                                    </h3>
                                    <audio
                                        controls
                                        className="w-full"
                                        src={verse.audioUrl}
                                    >
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {verse && (
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
                            {copied ? 'Tersalin!' : 'Salin Ayat'}
                        </button>

                        {verse.audioUrl && (
                            <button
                                onClick={() => {
                                    const audio = new Audio(verse.audioUrl);
                                    audio.play();
                                }}
                                className="px-4 py-2.5 bg-surface-200 rounded-lg text-gray-300 hover:bg-surface-300 transition-colors"
                            >
                                <Volume2 size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
