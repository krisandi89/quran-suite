/**
 * Full Surah Modal
 * Continuous reading view displaying all ayahs of a selected surah
 * Clicking any ayah number opens the detail modal for that verse
 */
import { useEffect, useState, useRef } from 'react';
import { X, ArrowLeft, Loader2, BookOpen, Search, ArrowUp } from 'lucide-react';
import { getFullSurah } from '@/services';
import { SURAH_INFO } from '@/data/surahData';

interface FullSurahModalProps {
    surah: number;
    isOpen: boolean;
    onClose: () => void;
    onSelectAyah: (surah: number, ayah: number) => void;
    onBackToBrowse?: () => void;
}

interface SurahData {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
    tempatTurun: string;
    arti: string;
    deskripsi: string;
    ayat: {
        nomorAyat: number;
        teksArab: string;
        teksLatin: string;
        teksIndonesia: string;
    }[];
}

export function FullSurahModal({ surah, isOpen, onClose, onSelectAyah, onBackToBrowse }: FullSurahModalProps) {
    const [surahData, setSurahData] = useState<SurahData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterQuery, setFilterQuery] = useState('');
    const [jumpAyah, setJumpAyah] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentSurahMeta = SURAH_INFO[surah - 1];

    useEffect(() => {
        if (!isOpen) return;

        const controller = new AbortController();
        setIsLoading(true);
        setError(null);
        setFilterQuery('');
        setJumpAyah('');

        getFullSurah(surah, controller.signal)
            .then((data: SurahData) => {
                setSurahData(data);
            })
            .catch((err: Error) => {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Gagal memuat surah.');
                }
            })
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [surah, isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    const handleJumpToAyah = (e: React.FormEvent) => {
        e.preventDefault();
        const ayahNum = parseInt(jumpAyah, 10);
        if (!isNaN(ayahNum) && ayahNum >= 1 && ayahNum <= (surahData?.jumlahAyat || 0)) {
            const el = document.getElementById(`ayah-${surah}-${ayahNum}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const scrollToTop = () => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!isOpen && !isClosing) return null;

    const filteredAyat = surahData?.ayat.filter((a) => {
        if (!filterQuery.trim()) return true;
        const q = filterQuery.toLowerCase();
        return (
            a.nomorAyat.toString() === q ||
            a.teksIndonesia.toLowerCase().includes(q) ||
            a.teksLatin.toLowerCase().includes(q)
        );
    }) || [];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
                <div
                    className={`
                        w-full max-w-4xl h-[92vh] bg-surface-50 rounded-2xl shadow-2xl shadow-black/60
                        border border-surface-200 flex flex-col overflow-hidden relative
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between p-4 border-b border-surface-200 bg-surface-100 gap-3 shrink-0">
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
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-white">
                                        {currentSurahMeta?.englishName || surahData?.namaLatin || `Surah ${surah}`}
                                    </h2>
                                    <span className="text-sm font-bold arabic-text text-accent">
                                        {surahData?.nama || currentSurahMeta?.name}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    Surah {surah} • {surahData?.jumlahAyat || currentSurahMeta?.numberOfAyahs} Ayat • {surahData?.tempatTurun || ''}
                                </p>
                            </div>
                        </div>

                        {/* Search & Jump controls */}
                        <div className="flex items-center gap-2">
                            {/* Jump to Ayah Form */}
                            <form onSubmit={handleJumpToAyah} className="flex items-center gap-1 bg-surface-200 px-2 py-1 rounded-lg">
                                <span className="text-xs text-gray-400 hidden sm:inline">Ke Ayat:</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={surahData?.jumlahAyat || 286}
                                    value={jumpAyah}
                                    onChange={(e) => setJumpAyah(e.target.value)}
                                    placeholder="No"
                                    className="w-12 bg-surface-300 text-white text-xs px-1.5 py-1 rounded outline-none text-center"
                                />
                                <button type="submit" className="text-xs px-2 py-1 bg-accent text-white rounded font-medium hover:bg-accent-dark transition-colors">
                                    Go
                                </button>
                            </form>

                            {/* Close */}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-white transition-colors"
                                title="Tutup"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="px-4 py-2 border-b border-surface-200 bg-surface flex items-center gap-2 shrink-0">
                        <Search size={16} className="text-gray-500 shrink-0" />
                        <input
                            type="text"
                            placeholder="Cari kata kunci dalam surah ini..."
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                        />
                        {filterQuery && (
                            <button onClick={() => setFilterQuery('')} className="text-xs text-gray-400 hover:text-white">
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Surah Content (Scrollable List) */}
                    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-surface">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-16 text-accent">
                                <Loader2 size={36} className="animate-spin mb-3" />
                                <p className="text-sm text-gray-400">Memuat seluruh ayat surah...</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-6 bg-red-900/30 border border-red-500/30 rounded-xl text-center">
                                <p className="text-red-400 text-sm mb-2">{error}</p>
                                <button
                                    onClick={() => {
                                        setIsLoading(true);
                                        setError(null);
                                        getFullSurah(surah).then((d: SurahData) => setSurahData(d)).catch((e: Error) => setError(e.message)).finally(() => setIsLoading(false));
                                    }}
                                    className="px-4 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        )}

                        {!isLoading && surahData && (
                            <>
                                {/* Bismillah Header */}
                                {surah !== 1 && surah !== 9 && (
                                    <div className="text-center py-4 my-2 border-b border-surface-200">
                                        <p className="arabic-text text-2xl sm:text-3xl text-accent">
                                            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang
                                        </p>
                                    </div>
                                )}

                                {/* Verse List */}
                                <div className="space-y-6">
                                    {filteredAyat.map((ayat) => (
                                        <div
                                            key={`surah-${surah}-ayah-${ayat.nomorAyat}`}
                                            id={`ayah-${surah}-${ayat.nomorAyat}`}
                                            className="p-4 sm:p-5 rounded-xl bg-surface-50 border border-surface-200 hover:border-accent/40 transition-all space-y-4 group"
                                        >
                                            {/* Header Verse row with interactive Ayah Badge */}
                                            <div className="flex items-center justify-between gap-4">
                                                <button
                                                    onClick={() => onSelectAyah(surah, ayat.nomorAyat)}
                                                    className="
                                                        flex items-center gap-2 px-3 py-1.5 rounded-lg 
                                                        bg-surface-200 hover:bg-accent hover:text-white 
                                                        text-accent font-semibold text-sm transition-all
                                                        shadow-sm hover:shadow-accent/20 group/btn
                                                    "
                                                    title="Klik untuk membuka Detail Ayat lengkap"
                                                >
                                                    <span className="w-6 h-6 rounded-full bg-accent/20 group-hover/btn:bg-white/20 flex items-center justify-center text-xs">
                                                        {ayat.nomorAyat}
                                                    </span>
                                                    <span className="text-xs">Detail Ayat & Tafsir →</span>
                                                </button>
                                                <span className="text-xs text-gray-500">
                                                    Ayat {ayat.nomorAyat} / {surahData.jumlahAyat}
                                                </span>
                                            </div>

                                            {/* Arabic Text */}
                                            <div
                                                onClick={() => onSelectAyah(surah, ayat.nomorAyat)}
                                                className="cursor-pointer p-3 rounded-lg hover:bg-surface-100/60 transition-colors"
                                            >
                                                <p className="arabic-text text-2xl sm:text-3xl text-white leading-loose text-right">
                                                    {ayat.teksArab}
                                                </p>
                                            </div>

                                            {/* Transliteration & Indonesian Translation */}
                                            <div className="space-y-1.5 pt-2 border-t border-surface-200/50">
                                                <p className="text-xs text-accent-light/80 italic font-mono">
                                                    {ayat.teksLatin}
                                                </p>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    {ayat.teksIndonesia}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Scroll to Top Floating Button */}
                    <button
                        onClick={scrollToTop}
                        className="absolute bottom-6 right-6 p-3 rounded-full bg-accent text-white shadow-xl hover:bg-accent-dark transition-all opacity-80 hover:opacity-100"
                        title="Kembali ke atas"
                    >
                        <ArrowUp size={18} />
                    </button>
                </div>
            </div>
        </>
    );
}
