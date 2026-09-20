/**
 * Hadith Result Item Component
 * Displays a hadith search result in the Spotlight modal
 */
import { ScrollText } from 'lucide-react';
import type { HadithSearchResult } from '@/types';
import { HighlightText } from './HighlightText';

interface HadithResultItemProps {
    result: HadithSearchResult;
    query: string;
    isSelected: boolean;
    onSelect: () => void;
}

// Collection colors
const COLLECTION_COLORS: Record<string, string> = {
    bukhari: 'bg-emerald-100 text-emerald-800 font-medium',
    muslim: 'bg-blue-100 text-blue-800 font-medium',
    ahmad: 'bg-purple-100 text-purple-800 font-medium',
    tirmidzi: 'bg-rose-100 text-rose-800 font-medium',
};

export function HadithResultItem({
    result,
    query,
    isSelected,
    onSelect,
}: HadithResultItemProps) {
    // Truncate text for display with null guard
    const indonesianText = result.text?.indonesian || '';
    const displayText = indonesianText.length > 200
        ? indonesianText.substring(0, 200) + '...'
        : indonesianText;

    const colorClass = COLLECTION_COLORS[result.collection] || 'bg-gray-100 text-gray-700';

    return (
        <div
            className={`
                px-4 py-3 cursor-pointer transition-colors border-b border-gray-100
                ${isSelected ? 'bg-emerald-50/80 border-l-2 border-l-accent' : 'hover:bg-gray-50'}
            `}
            onClick={onSelect}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-emerald-100">
                    <ScrollText size={14} className="text-emerald-700" />
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${colorClass}`}>
                    {result.collectionName || result.collection}
                </span>
                <span className="text-sm text-gray-500">
                    No. {result.number}
                </span>
            </div>

            {/* Hadith text */}
            <p className="text-sm text-gray-600 leading-relaxed">
                <HighlightText text={displayText} highlight={query} />
            </p>
        </div>
    );
}
