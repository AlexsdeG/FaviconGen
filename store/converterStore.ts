import { create } from 'zustand';
import { ConverterState } from '../types';

export const useConverterStore = create<ConverterState>((set) => ({
  originalFile: null,
  croppedImage: null,
  isCropping: false,
  generatedIcons: [],
  setOriginalFile: (file) => set({ originalFile: file, isCropping: !!file }),
  setCroppedImage: (img) => set({ croppedImage: img, isCropping: false }),
  setIsCropping: (isCropping) => set({ isCropping }),
  setGeneratedIcons: (icons) => set({ generatedIcons: icons }),
}));
