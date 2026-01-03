import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

export const useKeyboardShortcuts = () => {
    const {
        undo,
        redo,
        removeLayer,
        updateLayer,
        selectedLayerId,
        layers,
        history,
        historyIndex
    } = useEditorStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input or textarea
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
                return;
            }

            // --- Undo / Redo ---
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            // --- Layer Actions (Require Selection) ---
            if (selectedLayerId) {
                const selectedLayer = layers.find(l => l.id === selectedLayerId);
                if (!selectedLayer) return;

                // Delete
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    removeLayer(selectedLayerId);
                }

                // Arrow Movement (1px nudge)
                // Shift + Arrow could be 10px (optional enhancement, sticking to request for now)
                const step = e.shiftKey ? 10 : 1;

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    updateLayer(selectedLayerId, { y: selectedLayer.y - step }, true); // Save history on move? Maybe debounce?
                    // For single key presses, save history is fine. Continuous hold might spam history. 
                    // For now, simple implementation.
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    updateLayer(selectedLayerId, { y: selectedLayer.y + step }, true);
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    updateLayer(selectedLayerId, { x: selectedLayer.x - step }, true);
                }
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    updateLayer(selectedLayerId, { x: selectedLayer.x + step }, true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, removeLayer, updateLayer, selectedLayerId, layers]);
};
