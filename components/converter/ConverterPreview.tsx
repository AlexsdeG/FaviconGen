import React, { useEffect, useState } from 'react';
import { useConverterStore } from '../../store/converterStore';
import { useUIStore } from '../../store/uiStore';
import { resizeImage } from '../../lib/image-processing/resizer';
import { Download, RefreshCw, Layers } from 'lucide-react';
import { cn } from '../../lib/utils';
import BrowserMockup from '../common/preview/BrowserMockup';

const ConverterPreview: React.FC = () => {
  const { croppedImage, setOriginalFile, setCroppedImage } = useConverterStore();
  const { setExportModalOpen } = useUIStore();
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    if (croppedImage) {
      generatePreviews();
    }
  }, [croppedImage]);

  const generatePreviews = async () => {
    if (!croppedImage) return;
    
    const urls: Record<number, string> = {};
    const previewSizes = [32, 192];
    
    // Generate simple previews for UI
    for (const size of previewSizes) {
        const blob = await resizeImage(croppedImage, size, size);
        urls[size] = URL.createObjectURL(blob);
    }
    setPreviewUrls(urls);
  };

  const handleOpenExport = async () => {
      if (!croppedImage) return;
      // Convert base64 to blob for the worker
      const res = await fetch(croppedImage);
      const blob = await res.blob();
      setExportModalOpen(true, blob);
  };

  const handleReset = () => {
    setOriginalFile(null);
    setCroppedImage(null);
  };

  if (!croppedImage) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-white">Preview & Download</h2>
        <div className="flex gap-3">
             <button 
                onClick={handleReset}
                className="px-4 py-2 rounded-lg glass-btn flex items-center gap-2 focus:outline-none"
            >
                <RefreshCw size={16} />
                Start Over
            </button>
            <button 
                onClick={handleOpenExport}
                className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
                <Download size={18} />
                Download Zip
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Browser Mockup */}
        <BrowserMockup 
            faviconUrl={previewUrls[32]} 
            title="My Awesome Website" 
            url="https://my-awesome-website.com"
            className="h-full"
        />

        {/* Mobile Mockup */}
        <div className="glass-panel rounded-xl p-6">
             <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">iOS Home Screen</h3>
             <div className="flex justify-center py-4">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-[84px] h-[84px] rounded-[1.4rem] overflow-hidden shadow-2xl bg-black border border-white/5 relative">
                        {previewUrls[192] && <img src={previewUrls[192]} className="w-full h-full object-cover" alt="" />}
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.4rem]"></div>
                    </div>
                    <span className="text-[11px] text-white/90 font-medium tracking-tight drop-shadow-md">My App</span>
                 </div>
             </div>
        </div>
      </div>

      {/* Generated Assets Preview */}
      <div className="glass-panel rounded-xl p-6 mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={14} />
                  Generated Assets
              </h3>
              <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-500 border border-white/5">
                7 files
              </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* ICO */}
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:bg-[#252525] transition-colors relative overflow-hidden">
                  <div className="w-16 h-16 flex items-center justify-center bg-black/20 rounded-lg">
                       <div className="text-xs font-bold text-slate-500">ICO</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-300">favicon.ico</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">32×32</div>
                  </div>
              </div>

              {/* 16x16 */}
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:bg-[#252525] transition-colors">
                  <div className="w-16 h-16 flex items-center justify-center">
                       {previewUrls[32] && <img src={previewUrls[32]} className="w-4 h-4 rendering-pixelated" alt="" />}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-300">16×16</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">favicon-16x16.png</div>
                  </div>
              </div>

              {/* 32x32 */}
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:bg-[#252525] transition-colors">
                  <div className="w-16 h-16 flex items-center justify-center">
                       {previewUrls[32] && <img src={previewUrls[32]} className="w-8 h-8 rendering-pixelated" alt="" />}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-300">32×32</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">favicon-32x32.png</div>
                  </div>
              </div>

              {/* 180x180 */}
               <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:bg-[#252525] transition-colors">
                  <div className="w-16 h-16 flex items-center justify-center">
                       {previewUrls[192] && <img src={previewUrls[192]} className="w-10 h-10 rounded-xl" alt="" />}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-300">180×180</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">apple-touch-icon.png</div>
                  </div>
              </div>

              {/* 192x192 */}
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:bg-[#252525] transition-colors">
                  <div className="w-16 h-16 flex items-center justify-center">
                       {previewUrls[192] && <img src={previewUrls[192]} className="w-12 h-12 rounded" alt="" />}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-300">192×192</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">android-chrome-192...</div>
                  </div>
              </div>

               {/* 512x512 */}
               <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:bg-[#252525] transition-colors">
                  <div className="w-16 h-16 flex items-center justify-center">
                       {previewUrls[192] && <img src={previewUrls[192]} className="w-14 h-14 rounded" alt="" />}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-300">512×512</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">android-chrome-512...</div>
                  </div>
              </div>
              
              {/* Manifest */}
               <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:bg-[#252525] transition-colors cursor-default">
                  <div className="w-16 h-16 flex items-center justify-center bg-black/20 rounded-lg text-amber-500 font-mono text-xl">
                       {`{}`}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-300">Manifest</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">site.webmanifest</div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default ConverterPreview;
