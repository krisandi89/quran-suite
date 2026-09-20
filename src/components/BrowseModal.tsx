/**
 * Browse Modal
 * Displays a list/grid of all 114 Surahs for sequential reading
 */
import { useState, useMemo } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { SURAH_INFO } from '@/data/surahData';

interface BrowseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSurah: (surahNumber: number) => void;
}

export function BrowseModal({ isOpen, onClose, onSelectSurah }: BrowseModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    // Filter surahs based on search query
    const filteredSurahs = useMemo(() => {
        if (!searchQuery.trim()) return SURAH_INFO;
        const query = searchQuery.toLowerCase();
        return SURAH_INFO.filter(surah =>
            surah.englishName.toLowerCase().includes(query) ||
            surah.name.includes(query) ||
            surah.number.toString() === query
        );
    }, [searchQuery]);

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            setSearchQuery('');
            onClose();
        }, 200);
    };

    if (!isOpen && !isClosing) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div
                    className={`
                        w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl
                        border border-[#E6DFD3] flex flex-col overflow-hidden
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#E6DFD3] bg-[#FBF9F5]">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-100 rounded-xl">
                                <BookOpen size={24} className="text-emerald-700" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Daftar Surah</h2>
                                <p className="text-xs sm:text-sm text-gray-500">Pilih surah untuk mulai membaca</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 border-b border-[#E6DFD3] bg-white">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama surah atau nomor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#FAF8F5] text-gray-900 placeholder:text-gray-400 rounded-xl py-3 pl-12 pr-4 outline-none border border-[#E6DFD3] focus:border-emerald-600 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Surah Grid */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
                        {filteredSurahs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
                                <BookOpen size={48} className="mb-4 opacity-30 text-gray-400" />
                                <p className="text-gray-600 font-medium">Surah tidak ditemukan</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {filteredSurahs.map((surah) => (
                                    <button
                                        key={surah.number}
                                        onClick={() => {
                                            onSelectSurah(surah.number);
                                            handleClose();
                                        }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DFD3] hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/5 transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center relative overflow-hidden group-hover:bg-emerald-100 group-hover:border-emerald-300 transition-colors">
                                            <span className="text-sm font-bold text-gray-600 group-hover:text-emerald-800 relative z-10 transition-colors">
                                                {surah.number}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                                                {surah.englishName}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {surah.numberOfAyahs} Ayat
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-xl font-bold arabic-text text-gray-800 group-hover:text-emerald-700 transition-colors">
                                            {surah.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
