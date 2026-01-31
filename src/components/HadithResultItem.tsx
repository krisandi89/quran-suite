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
    bukhari: 'bg-emerald-500/20 text-emerald-400',
    muslim: 'bg-blue-500/20 text-blue-400',
    ahmad: 'bg-purple-500/20 text-purple-400',
    tirmidzi: 'bg-rose-500/20 text-rose-400',
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

    const colorClass = COLLECTION_COLORS[result.collection] || 'bg-gray-500/20 text-gray-400';

    return (
        <div
            className={`
                px-4 py-3 cursor-pointer transition-colors border-b border-surface-100
                ${isSelected ? 'bg-accent/10' : 'hover:bg-surface-100'}
            `}
            onClick={onSelect}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-emerald-500/20">
                    <ScrollText size={14} className="text-emerald-400" />
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${colorClass}`}>
                    {result.collectionName || result.collection}
                </span>
                <span className="text-sm text-gray-500">
                    No. {result.number}
                </span>
            </div>

            {/* Hadith text */}
            <p className="text-sm text-gray-400 leading-relaxed">
                <HighlightText text={displayText} highlight={query} />
            </p>
        </div>
    );
}
