/**
 * Custom hook for keyboard shortcuts
 */
import { useEffect, useCallback } from 'react';

interface KeyboardShortcutOptions {
    onOpen: () => void;
    onClose: () => void;
    onUp: () => void;
    onDown: () => void;
    onEnter: () => void;
    isOpen: boolean;
}

export function useKeyboardShortcuts({
    onOpen,
    onClose,
    onUp,
    onDown,
    onEnter,
    isOpen,
}: KeyboardShortcutOptions) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Cmd+K / Ctrl+K to open spotlight
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            if (isOpen) {
                onClose();
            } else {
                onOpen();
            }
            return;
        }

        // Only handle other shortcuts when spotlight is open
        if (!isOpen) return;

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                onClose();
                break;
            case 'ArrowUp':
                event.preventDefault();
                onUp();
                break;
            case 'ArrowDown':
                event.preventDefault();
                onDown();
                break;
            case 'Enter':
                event.preventDefault();
                onEnter();
                break;
        }
    }, [isOpen, onOpen, onClose, onUp, onDown, onEnter]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
