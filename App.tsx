import React from 'react';
import MainLayout from './components/layout/MainLayout';
import DropZone from './components/converter/DropZone';
import ImageCropper from './components/converter/ImageCropper';
import ConverterPreview from './components/converter/ConverterPreview';
import GeneratorLayout from './components/generator/GeneratorLayout';
import ExportModal from './components/modals/ExportModal';
import { useConverterStore } from './store/converterStore';
import { useUIStore } from './store/uiStore';
import { Toaster } from 'sonner';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const { isCropping, croppedImage } = useConverterStore();
  const { mode } = useUIStore();

  useKeyboardShortcuts();

  return (
    <MainLayout>
      <Toaster position="bottom-right" theme="dark" />
      <ExportModal />

      {mode === 'converter' ? (
        <div className="max-w-4xl mx-auto space-y-12">
          {!croppedImage ? (
            <div className="animate-in fade-in zoom-in-95">
              <DropZone />
            </div>
          ) : (
            <ConverterPreview />
          )}
          {isCropping && <ImageCropper />}
        </div>
      ) : (
        <div className="w-full h-full">
          <GeneratorLayout />
        </div>
      )}

    </MainLayout>
  );
}

export default App;
