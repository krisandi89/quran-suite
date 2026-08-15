/**
 * Hadith Detail Drawer
 * Slides in from right with full hadith information
 */
import { useEffect, useState } from 'react';
import { X, Copy, Check, ScrollText } from 'lucide-react';
import { getHadith } from '@/services';
import type { HadithEntry, HadithCollection } from '@/types';

interface HadithDrawerProps {
    collection: HadithCollection;
    number: number;
    isOpen: boolean;
    onClose: () => void;
}

// Collection display names
const COLLECTION_NAMES: Record<HadithCollection, string> = {
    bukhari: 'Sahih Bukhari',
    muslim: 'Sahih Muslim',
    ahmad: 'Musnad Ahmad',
    tirmidzi: 'Jami\' at-Tirmidzi',
};

// Collection colors
const COLLECTION_COLORS: Record<HadithCollection, string> = {
    bukhari: 'from-emerald-500 to-emerald-600',
    muslim: 'from-blue-500 to-blue-600',
    ahmad: 'from-purple-500 to-purple-600',
    tirmidzi: 'from-rose-500 to-rose-600',
};

export function HadithDrawer({ collection, number, isOpen, onClose }: HadithDrawerProps) {
    const [hadith, setHadith] = useState<HadithEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Fetch hadith detail
    useEffect(() => {
        if (!isOpen) return;

        const controller = new AbortController();
        setIsLoading(true);
        setError(null);

        getHadith(collection, number, controller.signal)
            .then(setHadith)
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                }
            })
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [collection, number, isOpen]);

    // Handle close with animation
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 200);
    };

    // Copy hadith to clipboard
    const handleCopy = async () => {
        if (!hadith) return;

        const text = `${COLLECTION_NAMES[collection]} No. ${hadith.number}\n\n${hadith.arabic}\n\n${hadith.indonesian}`;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    const colorClass = COLLECTION_COLORS[collection];

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
                <div className={`bg-gradient-to-r ${colorClass} p-4`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/20">
                                <ScrollText size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {COLLECTION_NAMES[collection]}
                                </h2>
                                <p className="text-sm text-white/80">
                                    Hadis No. {number}
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
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {hadith && !isLoading && (
                        <div className="space-y-6">
                            {/* Arabic */}
                            {hadith.arabic && (
                                <div className="p-4 bg-surface-100 rounded-xl">
                                    <p className="arabic-text text-xl text-white leading-loose text-right">
                                        {hadith.arabic}
                                    </p>
                                </div>
                            )}

                            {/* Indonesian */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">
                                    Terjemahan Indonesia
                                </h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {hadith.indonesian}
                                </p>
                            </div>

                            {/* Narrators */}
                            {hadith.narrators && hadith.narrators.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                                        Perawi
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {hadith.narrators.join(' → ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {hadith && (
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
                            {copied ? 'Tersalin!' : 'Salin Hadis'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </>
);
}
