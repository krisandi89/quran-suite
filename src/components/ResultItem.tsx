/**
 * Individual search result row component
 */
import { Copy, ChevronRight } from 'lucide-react';
import { HighlightText } from './HighlightText';
import type { SearchResult, SearchMode } from '@/types';

interface ResultItemProps {
    result: SearchResult;
    query: string;
    mode: SearchMode;
    isSelected: boolean;
    onSelect: () => void;
    onCopy: () => void;
}

export function ResultItem({
    result,
    query,
    mode,
    isSelected,
    onSelect,
    onCopy,
}: ResultItemProps) {
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopy();
    };

    return (
        <div
            onClick={onSelect}
            className={`
        group relative px-4 py-3 cursor-pointer transition-all duration-150
        border-b border-surface-100/50
        ${isSelected
                    ? 'bg-gradient-to-r from-accent/10 to-transparent border-l-2 border-l-accent'
                    : 'hover:bg-surface-50/50'
                }
      `}
        >
            {/* Header: Surah & Ayah */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-accent font-semibold text-sm">
                        {result.surah.englishName}
                    </span>
                    <span className="text-gray-500 text-sm">
                        {result.surah.number}:{result.ayah}
                    </span>
                </div>

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="
            opacity-0 group-hover:opacity-100 transition-opacity
            p-1.5 rounded-md hover:bg-surface-200 text-gray-400 hover:text-accent
          "
                    title="Copy verse"
                >
                    <Copy size={14} />
                </button>
            </div>

            {/* Arabic text */}
            <div className="arabic-text text-xl text-white/90 mb-2 leading-loose">
                {mode === 'arabic' ? (
                    <HighlightText text={result.text.arabic} highlight={query} />
                ) : (
                    result.text.arabic
                )}
            </div>

            {/* Indonesian translation */}
            <div className="text-sm text-gray-400 leading-relaxed">
                {mode === 'indonesian' ? (
                    <HighlightText text={result.text.indonesian} highlight={query} />
                ) : (
                    result.text.indonesian
                )}
            </div>

            {/* Selection indicator */}
            {isSelected && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronRight className="text-accent" size={20} />
                </div>
            )}
        </div>
    );
}
