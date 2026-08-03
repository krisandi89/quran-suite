/**
 * Highlight matched terms in text
 */

interface HighlightProps {
    text: string | null | undefined;
    highlight: string;
    className?: string;
}

export function HighlightText({ text, highlight, className = '' }: HighlightProps) {
    // Guard against null/undefined text
    if (!text) {
        return <span className={className}></span>;
    }

    // Ensure text is a string
    const textStr = String(text);
    const query = highlight || '';

    if (!query.trim()) {
        return <span className={className}>{textStr}</span>;
    }

    // Case-insensitive search and split
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    const parts = textStr.split(regex);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                const isMatch = part.toLowerCase() === query.toLowerCase();
                return isMatch ? (
                    <mark key={index} className="highlight-match bg-transparent">
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                );
            })}
        </span>
    );
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
