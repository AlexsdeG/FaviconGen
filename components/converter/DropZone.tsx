import React, { useCallback } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useConverterStore } from '../../store/converterStore';
import { cn } from '../../lib/utils';

const DropZone: React.FC = () => {
  const setOriginalFile = useConverterStore((state) => state.setOriginalFile);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG, JPG, WEBP, or SVG.');
      return;
    }
    setError(null);
    setOriginalFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, [setOriginalFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={cn(
        "relative group cursor-pointer w-full max-w-2xl mx-auto min-h-[400px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 focus:outline-none",
        isDragActive 
          ? "border-brand-500 bg-brand-500/10 scale-[1.02]" 
          : "border-white/10 hover:border-white/20 bg-white/5"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
      tabIndex={0}
      role="button"
      aria-label="Upload Image"
    >
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileInput}
      />

      <div className="flex flex-col items-center text-center p-8 space-y-6">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
          isDragActive ? "bg-brand-500 text-white" : "bg-white/10 text-white/50 group-hover:bg-brand-500/20 group-hover:text-brand-400"
        )}>
           {error ? <AlertCircle size={40} className="text-red-400" /> : <Upload size={40} />}
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-white">
            {isDragActive ? "Drop it like it's hot!" : "Upload your image"}
          </h3>
          <p className="text-slate-400 max-w-sm">
             Drag & drop your logo here, or click to browse. 
             Supports PNG, JPG, SVG.
          </p>
        </div>

        {error && (
            <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {error}
            </div>
        )}

        <div className="flex gap-4 mt-4">
           {['PNG', 'JPG', 'SVG'].map(ext => (
               <span key={ext} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-mono">
                   {ext}
               </span>
           ))}
        </div>
      </div>
    </div>
  );
};

export default DropZone;