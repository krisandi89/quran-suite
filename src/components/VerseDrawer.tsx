/**
 * Verse Detail Drawer
 * Slides in from right with full verse information
 */
import { useEffect, useState, useRef } from 'react';
import { X, Copy, Volume2, Check, ChevronLeft, ChevronRight, BookMarked, ScrollText, ArrowLeft, BookOpen, LibraryBig, BookOpenText } from 'lucide-react';
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
    onSearchRelated?: (keyword: string, surah?: number, ayah?: number) => void;
    onBackToBrowse?: () => void;
    onOpenFullSurah?: (surah: number) => void;
    onBackToMushaf?: () => void;
}

export function VerseDrawer({ surah, ayah, isOpen, onClose, onNavigate, onOpenTafsir, onSearchRelated, onBackToBrowse, onOpenFullSurah, onBackToMushaf }: VerseDrawerProps) {
    const [verse, setVerse] = useState<VerseDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Touch gesture ref for mobile swipe
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        touchStartX.current = null;
        touchStartY.current = null;

        // Check horizontal swipe threshold (minimum 40px swipe, maximum 60px vertical drift)
        if (Math.abs(deltaX) > 40 && Math.abs(deltaY) < 60) {
            if (deltaX < 0) {
                // Swipe Left -> Next Ayah
                const currentSurah = SURAH_INFO[surah - 1];
                if (currentSurah && ayah < currentSurah.numberOfAyahs) {
                    onNavigate(surah, ayah + 1);
                } else if (surah < 114) {
                    onNavigate(surah + 1, 1);
                }
            } else {
                // Swipe Right -> Previous Ayah
                if (ayah > 1) {
                    onNavigate(surah, ayah - 1);
                } else if (surah > 1) {
                    const prevSurah = SURAH_INFO[surah - 2];
                    if (prevSurah) {
                        onNavigate(surah - 1, prevSurah.numberOfAyahs);
                    }
                }
            }
        }
    };

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
                    <div className="flex items-center justify-between p-4 border-b border-[#E6DFD3] bg-[#FBF9F5]">
                        <div className="flex items-center gap-2.5">
                            {onBackToMushaf && (
                                <button
                                    onClick={() => {
                                        handleClose();
                                        onBackToMushaf();
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors text-xs sm:text-sm font-semibold shadow-xs"
                                    title="Kembali ke Mushaf Madinah"
                                >
                                    <BookOpenText size={17} />
                                    <span>Kembali ke Mushaf</span>
                                </button>
                            )}
                            {onBackToBrowse && (
                                <button
                                    onClick={() => {
                                        handleClose();
                                        onBackToBrowse();
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-xs sm:text-sm font-medium"
                                    title="Kembali ke Daftar Surah"
                                >
                                    <ArrowLeft size={16} />
                                    <span className="hidden sm:inline">Daftar Surah</span>
                                </button>
                            )}
                            {!onBackToMushaf && !onBackToBrowse && (
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <BookOpen size={20} className="text-emerald-700" />
                                </div>
                            )}
                            {verse && (
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                                        {verse.surahEnglishName}
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Surah {verse.surah}, Ayat {verse.ayah}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Navigation & Close */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
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
                                    className="p-1.5 rounded hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
                                    className="p-1.5 rounded hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    title="Ayat Selanjutnya"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                                title="Tutup (Esc)"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto p-5 sm:p-6 select-none sm:select-auto bg-white"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {isLoading && (
                        <div className="space-y-4">
                            <div className="skeleton h-24 rounded-lg" />
                            <div className="skeleton h-16 rounded-lg" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-500 font-medium">{error}</p>
                        </div>
                    )}

                    {verse && !isLoading && (
                        <div className="space-y-6">
                            {/* Mobile Swipe hint */}
                            <div className="text-center sm:hidden text-[11px] text-gray-500 bg-[#F3EFE6] py-1 px-3 rounded-full mx-auto w-fit">
                                👈 Usap (swipe) kiri / kanan untuk ganti ayat 👉
                            </div>

                            {/* Arabic */}
                            <div className="p-5 sm:p-6 bg-[#FAF8F5] border border-[#E6DFD3] rounded-2xl shadow-xs">
                                <p className="arabic-text text-2xl sm:text-3xl text-gray-900 leading-loose text-right">
                                    {verse.arabic}
                                </p>
                            </div>

                            {/* Indonesian */}
                            <div className="bg-[#FAF8F5] border border-[#E6DFD3] p-4 rounded-xl">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Terjemahan Indonesia
                                </h3>
                                <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                                    {verse.indonesian}
                                </p>
                            </div>

                            {/* Audio (if available) */}
                            {verse.audioUrl && (
                                <div className="bg-[#FAF8F5] border border-[#E6DFD3] p-4 rounded-xl">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                        Murottal Audio
                                    </h3>
                                    <audio
                                        controls
                                        className="w-full"
                                        src={verse.audioUrl}
                                    >
                                        Browser Anda tidak mendukung audio.
                                    </audio>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {verse && (
                    <div className="p-4 border-t border-[#E6DFD3] bg-[#FBF9F5]">
                        {/* Kembali ke Mushaf Button (Prominent) */}
                        {onBackToMushaf && (
                            <button
                                onClick={() => {
                                    handleClose();
                                    onBackToMushaf();
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 mb-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.99]"
                            >
                                <BookOpenText size={17} />
                                <span>Kembali ke Mushaf Madinah</span>
                            </button>
                        )}

                        {/* Full Surah Button */}
                        {onOpenFullSurah && (
                            <button
                                onClick={() => onOpenFullSurah(surah)}
                                className="w-full flex items-center justify-center gap-2 py-2 mb-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-medium text-sm transition-all"
                            >
                                <LibraryBig size={16} />
                                Tampilkan Semua Ayat ({verse.surahEnglishName})
                            </button>
                        )}

                        {/* Action buttons (Copy & Audio) */}
                        <div className="flex gap-2.5 mb-2.5">
                            <button
                                onClick={handleCopy}
                                className={`
                    flex-1 flex items-center justify-center gap-2 py-2 rounded-xl
                    font-medium transition-all text-sm
                    ${copied
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white border border-[#E6DFD3] text-gray-700 hover:bg-gray-50'
                                    }
                  `}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Tersalin!' : 'Salin Ayat'}
                            </button>

                            {verse.audioUrl && (
                                <button
                                    onClick={() => {
                                        const audio = new Audio(verse.audioUrl);
                                        audio.play();
                                    }}
                                    className="px-4 py-2 bg-white border border-[#E6DFD3] rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                                    title="Putar Audio"
                                >
                                    <Volume2 size={16} />
                                </button>
                            )}
                        </div>

                        {/* Integration buttons (Tafsir & Hadis) */}
                        {(onOpenTafsir || onSearchRelated) && (
                            <div className="flex gap-2.5">
                                {onOpenTafsir && (
                                    <button
                                        onClick={() => onOpenTafsir(surah, ayah)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all font-medium text-sm"
                                    >
                                        <BookMarked size={16} className="text-amber-600" />
                                        Baca Tafsir
                                    </button>
                                )}
                                {onSearchRelated && (
                                    <button
                                        onClick={() => {
                                            onSearchRelated(verse.indonesian.split(' ').slice(0, 5).join(' '), surah, ayah);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all font-medium text-sm"
                                    >
                                        <ScrollText size={16} className="text-emerald-600" />
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
