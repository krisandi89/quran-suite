/**
 * Verse Detail Drawer
 * Slides in from right with full verse information
 */
import { useEffect, useState } from 'react';
import { X, Copy, Volume2, Check, ChevronLeft, ChevronRight, BookMarked, ScrollText, ArrowLeft, BookOpen } from 'lucide-react';
import { getVerseDetail } from '@/services';
import { SURAH_INFO } from '@/data/surahData';
import type { VerseDetail } from '@/types';

interface VerseDrawerProps {
    surah: number;
    ayah: number;
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (surah: number, ayah: number) => void;
    onOpenTafsir?: (surah: number, ayah: number) => void;
    onSearchRelated?: (keyword: string) => void;
    onBackToBrowse?: () => void;
}

export function VerseDrawer({ surah, ayah, isOpen, onClose, onNavigate, onOpenTafsir, onSearchRelated, onBackToBrowse }: VerseDrawerProps) {
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
                    <div className="flex items-center justify-between p-4 border-b border-surface-200 bg-surface-100">
                        <div className="flex items-center gap-3">
                            {onBackToBrowse ? (
                                <button
                                    onClick={() => {
                                        handleClose();
                                        onBackToBrowse();
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                                    title="Kembali ke Daftar Surah"
                                >
                                    <ArrowLeft size={18} />
                                    <span>Daftar Surah</span>
                                </button>
                            ) : (
                                <div className="p-2 bg-accent/20 rounded-lg">
                                    <BookOpen size={20} className="text-accent" />
                                </div>
                            )}
                            {verse && (
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        {verse.surahEnglishName}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        Surah {verse.surah}, Ayah {verse.ayah}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Navigation & Close */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-surface-200 p-1 rounded-lg">
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
                                    className="p-1.5 rounded hover:bg-surface-300 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Ayat Sebelumnya"
                                >
                                    <ChevronLeft size={18} />
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
                                    className="p-1.5 rounded hover:bg-surface-300 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Ayat Selanjutnya"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-white transition-colors"
                                title="Tutup (Esc)"
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
                    <div className="p-4 border-t border-surface-200">
                        {/* Action buttons (Copy & Audio) */}
                        <div className="flex gap-3 mb-3">
                            <button
                                onClick={handleCopy}
                                className={`
                    flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                    font-medium transition-all text-sm
                    ${copied
                                        ? 'bg-accent text-white'
                                        : 'bg-surface-200 text-gray-300 hover:bg-surface-300'
                                    }
                  `}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Tersalin' : 'Salin'}
                            </button>

                            {verse.audioUrl && (
                                <button
                                    onClick={() => {
                                        const audio = new Audio(verse.audioUrl);
                                        audio.play();
                                    }}
                                    className="px-4 py-2.5 bg-surface-200 rounded-lg text-gray-300 hover:bg-surface-300 transition-colors"
                                >
                                    <Volume2 size={16} />
                                </button>
                            )}
                        </div>

                        {/* Integration buttons (Tafsir & Hadis) */}
                        {(onOpenTafsir || onSearchRelated) && (
                            <div className="flex gap-3">
                                {onOpenTafsir && (
                                    <button
                                        onClick={() => onOpenTafsir(surah, ayah)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 transition-all font-medium text-sm"
                                    >
                                        <BookMarked size={16} />
                                        Baca Tafsir
                                    </button>
                                )}
                                {onSearchRelated && (
                                    <button
                                        onClick={() => {
                                            // Extract keywords or just pass "Surah X Ayat Y" to search
                                            // Ideally, we search using the Indonesian translation
                                            onSearchRelated(verse.indonesian.split(' ').slice(0, 5).join(' '));
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all font-medium text-sm"
                                    >
                                        <ScrollText size={16} />
                                        Hadis Terkait
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </>
);
}
