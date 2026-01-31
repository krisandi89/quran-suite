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
                px-4 py-3 cursor-pointer transition-colors border-b border-surface-100
                ${isSelected ? 'bg-accent/10' : 'hover:bg-surface-100'}
            `}
            onClick={onSelect}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-amber-500/20">
                    <BookMarked size={14} className="text-amber-400" />
                </div>
                <span className="text-sm font-medium text-white">
                    {result.surah?.englishName || 'Unknown'} {result.surah?.number || ''}:{result.ayah || ''}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
                    {result.sourceName || 'Tafsir'}
                </span>
            </div>

            {/* Tafsir text */}
            <p className="text-sm text-gray-400 leading-relaxed">
                <HighlightText text={displayText} highlight={query} />
            </p>
        </div>
    );
}
