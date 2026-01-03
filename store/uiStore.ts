import { create } from 'zustand';
import { AppMode } from '../types';

interface UIState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  
  // Export Modal State
  isExportModalOpen: boolean;
  exportSourceImage: Blob | null; // The source image to export (from converter or generator)
  setExportModalOpen: (isOpen: boolean, sourceImage?: Blob | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'converter',
  setMode: (mode) => set({ mode }),
  
  isExportModalOpen: false,
  exportSourceImage: null,
  setExportModalOpen: (isOpen, sourceImage) => set({ 
      isExportModalOpen: isOpen, 
      exportSourceImage: sourceImage !== undefined ? sourceImage : (isOpen ? undefined : null) 
  }),
}));
