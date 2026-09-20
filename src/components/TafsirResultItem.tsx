/**
 * Tafsir Result Item Component
 * Displays a tafsir search result in the Spotlight modal
 */
import { BookMarked } from 'lucide-react';
import type { TafsirSearchResult } from '@/types';
import { HighlightText } from './HighlightText';

interface TafsirResultItemProps {
    result: TafsirSearchResult;
    query: string;
    isSelected: boolean;
    onSelect: () => void;
}

export function TafsirResultItem({
    result,
    query,
    isSelected,
    onSelect,
}: TafsirResultItemProps) {
    // Truncate text for display with null guard
    const text = result.text || '';
    const displayText = text.length > 200
        ? text.substring(0, 200) + '...'
        : text;

    return (
        <div
            className={`
                px-4 py-3 cursor-pointer transition-colors border-b border-gray-100
                ${isSelected ? 'bg-amber-50/80 border-l-2 border-l-amber-500' : 'hover:bg-gray-50'}
            `}
            onClick={onSelect}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-amber-100">
                    <BookMarked size={14} className="text-amber-700" />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                    {result.surah?.englishName || 'Unknown'} {result.surah?.number || ''}:{result.ayah || ''}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-medium">
                    {result.sourceName || 'Tafsir'}
                </span>
            </div>

            {/* Tafsir text */}
            <p className="text-sm text-gray-600 leading-relaxed">
                <HighlightText text={displayText} highlight={query} />
            </p>
        </div>
    );
}
