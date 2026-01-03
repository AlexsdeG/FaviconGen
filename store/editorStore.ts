import { create } from 'zustand';
import { EditorState, Layer, CanvasConfig, SnappingOptions } from '../types';

// Helper to create safe updates
const updateLayerInList = (layers: Layer[], id: string, updates: Partial<Layer>) => {
    return layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } as Layer : layer
    );
};

const DEFAULT_GRADIENT = {
    type: 'linear' as const,
    angle: 90,
    stops: [
        { id: '1', offset: 0, color: '#6366f1' },
        { id: '2', offset: 1, color: '#a855f7' }
    ]
};

const DEFAULT_CANVAS: CanvasConfig = {
    width: 1024,
    height: 1024,
    backgroundType: 'solid',
    background: '#ffffff',
    backgroundGradient: DEFAULT_GRADIENT,
    cornerRadius: 0
};

const DEFAULT_SNAPPING: SnappingOptions = {
    enabled: true,
    grid: false,
    gridSize: 20,
    objects: true,
    canvas: true,
    rotation: true,
    rotationIncrement: 15,
    threshold: 10
};

export const useEditorStore = create<EditorState>((set, get) => ({
    isFreeScale: false,
    toggleFreeScale: () => set((state) => ({ isFreeScale: !state.isFreeScale })),
    layers: [],
    selectedLayerId: null,
    canvasConfig: DEFAULT_CANVAS,
    stageConfig: {
        scale: 1,
        x: 0,
        y: 0,
    },
    snapping: DEFAULT_SNAPPING,

    // Initialize history with default state
    history: [{ layers: [], canvasConfig: DEFAULT_CANVAS }],
    historyIndex: 0,

    saveHistory: () => {
        const { layers, canvasConfig, history, historyIndex } = get();
        // If current state is identical to history[historyIndex], don't push? 
        // Checking Deep equality is expensive, assume caller knows when to save.

        const newHistory = history.slice(0, historyIndex + 1);
        // Limit history size
        if (newHistory.length > 50) newHistory.shift();

        newHistory.push({
            layers: JSON.parse(JSON.stringify(layers)),
            canvasConfig: JSON.parse(JSON.stringify(canvasConfig))
        });

        set({ history: newHistory, historyIndex: newHistory.length - 1 });
    },

    undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const prevState = history[newIndex];
            set({
                layers: JSON.parse(JSON.stringify(prevState.layers)),
                canvasConfig: JSON.parse(JSON.stringify(prevState.canvasConfig)),
                historyIndex: newIndex,
                selectedLayerId: null
            });
        }
    },

    redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const nextState = history[newIndex];
            set({
                layers: JSON.parse(JSON.stringify(nextState.layers)),
                canvasConfig: JSON.parse(JSON.stringify(nextState.canvasConfig)),
                historyIndex: newIndex,
                selectedLayerId: null
            });
        }
    },

    addLayer: (layer) => {
        set((state) => {
            const newLayers = [...state.layers, layer];
            // Save history immediately
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            if (newHistory.length > 50) newHistory.shift();
            newHistory.push({ layers: newLayers, canvasConfig: state.canvasConfig });

            return {
                layers: newLayers,
                selectedLayerId: layer.id,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    },

    updateLayer: (id, updates, saveHistory = false) => {
        set((state) => {
            const newLayers = updateLayerInList(state.layers, id, updates);

            if (saveHistory) {
                const newHistory = state.history.slice(0, state.historyIndex + 1);
                if (newHistory.length > 50) newHistory.shift();
                newHistory.push({ layers: newLayers, canvasConfig: state.canvasConfig });
                return { layers: newLayers, history: newHistory, historyIndex: newHistory.length - 1 };
            }

            return { layers: newLayers };
        });
    },

    removeLayer: (id) => {
        set((state) => {
            const newLayers = state.layers.filter((l) => l.id !== id);

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ layers: newLayers, canvasConfig: state.canvasConfig });

            return {
                layers: newLayers,
                selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
                history: newHistory,
                historyIndex: newHistory.length - 1
            };
        });
    },

    selectLayer: (id) => set({ selectedLayerId: id }),

    deselectAll: () => set({ selectedLayerId: null }),

    reorderLayer: (id, direction) => {
        set((state) => {
            const index = state.layers.findIndex(l => l.id === id);
            if (index === -1) return {};

            const newLayers = [...state.layers];
            if (direction === 'up' && index < newLayers.length - 1) {
                [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
            } else if (direction === 'down' && index > 0) {
                [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
            } else {
                return {};
            }

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ layers: newLayers, canvasConfig: state.canvasConfig });

            return { layers: newLayers, history: newHistory, historyIndex: newHistory.length - 1 };
        });
    },

    setCanvasBackground: (bg) => {
        set((state) => {
            const newConfig = { ...state.canvasConfig, background: bg, backgroundType: 'solid' as const };
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ layers: state.layers, canvasConfig: newConfig });
            return { canvasConfig: newConfig, history: newHistory, historyIndex: newHistory.length - 1 };
        });
    },

    setCanvasConfig: (config, saveHistory = false) => {
        set((state) => {
            const newConfig = { ...state.canvasConfig, ...config };
            if (saveHistory) {
                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push({ layers: state.layers, canvasConfig: newConfig });
                return { canvasConfig: newConfig, history: newHistory, historyIndex: newHistory.length - 1 };
            }
            return { canvasConfig: newConfig };
        });
    },

    setStageConfig: (config) => set({ stageConfig: config }),

    setSnappingOptions: (options) => set((state) => ({
        snapping: { ...state.snapping, ...options }
    })),

    centerSelection: () => {
        set((state) => {
            if (!state.selectedLayerId) return {};
            const cx = state.canvasConfig.width / 2;
            const cy = state.canvasConfig.height / 2;
            const newLayers = updateLayerInList(state.layers, state.selectedLayerId, { x: cx, y: cy });

            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ layers: newLayers, canvasConfig: state.canvasConfig });

            return { layers: newLayers, history: newHistory, historyIndex: newHistory.length - 1 };
        });
    },
}));
