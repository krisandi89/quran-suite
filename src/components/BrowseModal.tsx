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
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div
                    className={`
                        w-full max-w-4xl h-[90vh] bg-surface-50 rounded-2xl shadow-2xl shadow-black/50
                        border border-surface-200 flex flex-col overflow-hidden
                        ${isClosing ? 'spotlight-exit' : 'spotlight-enter'}
                    `}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-200 bg-surface-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/20 rounded-lg">
                                <BookOpen size={24} className="text-accent" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Daftar Surah</h2>
                                <p className="text-sm text-gray-400">Pilih surah untuk mulai membaca</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-surface-200 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 border-b border-surface-200 bg-surface">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama surah atau nomor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-100 text-white placeholder:text-gray-500 rounded-xl py-3 pl-12 pr-4 outline-none border border-surface-200 focus:border-accent/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Surah Grid */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface">
                        {filteredSurahs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <BookOpen size={48} className="mb-4 opacity-20" />
                                <p>Surah tidak ditemukan</p>
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
                                        className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200 hover:border-accent hover:shadow-lg hover:shadow-accent/10 transition-all text-left group"
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-lg bg-surface-200 flex items-center justify-center relative overflow-hidden group-hover:bg-accent/20 transition-colors">
                                            <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-sm font-semibold text-gray-400 group-hover:text-accent relative z-10 transition-colors">
                                                {surah.number}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white truncate group-hover:text-accent transition-colors">
                                                {surah.englishName}
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {surah.numberOfAyahs} Ayat
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-xl font-bold arabic-text text-gray-300 group-hover:text-white transition-colors">
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
