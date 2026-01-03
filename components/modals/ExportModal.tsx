import { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { exportManager } from '../../lib/exportManager';
import { ExportSettings } from '../../types';
import { X, CheckCircle2, Download, Package, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const ExportModal = () => {
  const { isExportModalOpen, setExportModalOpen, exportSourceImage } = useUIStore();
  const [isExporting, setIsExporting] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
      packageType: 'essential',
      includeSvg: false,
      appName: 'My App',
      appShortName: 'App'
  });

  if (!isExportModalOpen) return null;

  const handleExport = async () => {
      if (!exportSourceImage) {
          toast.error("No image to export");
          return;
      }
      
      setIsExporting(true);
      try {
          // Generate the zip blob on the main thread
          const zipBlob = await exportManager.generatePackage(exportSourceImage, settings);
          
          
          // Construct a friendly filename
          const safeName = (settings.appShortName || 'favicon')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');
            
          // Simple main-thread download helper to avoid file-saver ESM issues
          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${safeName}-package.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success("Package downloaded successfully!");
          setExportModalOpen(false);
      } catch (e) {
          console.error(e);
          toast.error("Failed to generate package. Please try again.");
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 bg-[#121212] border border-white/10">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Package className="text-brand-500" size={20} />
                    Export Favicon Package
                </h3>
                <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 space-y-6">
                
                {/* Package Type Selection */}
                <div className="space-y-3">
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Select Package</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => setSettings({ ...settings, packageType: 'essential' })}
                            className={cn(
                                "relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                                settings.packageType === 'essential' 
                                    ? "bg-brand-500/10 border-brand-500 text-white shadow-lg shadow-brand-500/10" 
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300"
                            )}
                        >
                             <div className={cn(
                                 "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                 settings.packageType === 'essential' ? "border-brand-500 bg-brand-500 text-white" : "border-slate-500"
                             )}>
                                 {settings.packageType === 'essential' && <CheckCircle2 size={10} />}
                             </div>
                             <div>
                                 <div className="font-medium text-sm">Essential</div>
                                 <div className="text-xs text-slate-400 mt-1">Modern browsers, iOS, Android.</div>
                             </div>
                        </button>

                        <button
                            onClick={() => setSettings({ ...settings, packageType: 'complete' })}
                            className={cn(
                                "relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                                settings.packageType === 'complete' 
                                    ? "bg-brand-500/10 border-brand-500 text-white shadow-lg shadow-brand-500/10" 
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300"
                            )}
                        >
                             <div className={cn(
                                 "mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors",
                                 settings.packageType === 'complete' ? "border-brand-500 bg-brand-500 text-white" : "border-slate-500"
                             )}>
                                 {settings.packageType === 'complete' && <CheckCircle2 size={10} />}
                             </div>
                             <div>
                                 <div className="font-medium text-sm">Complete</div>
                                 <div className="text-xs text-slate-400 mt-1">Includes legacy sizes (Windows tiles, etc).</div>
                             </div>
                        </button>
                    </div>
                </div>

                {/* Manifest Settings */}
                <div className="space-y-3">
                    <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Manifest Info</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500">App Name</label>
                            <input 
                                type="text" value={settings.appName} 
                                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                                className="glass-input w-full text-sm py-1.5"
                                placeholder="My App"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500">Short Name</label>
                            <input 
                                type="text" value={settings.appShortName} 
                                onChange={(e) => setSettings({ ...settings, appShortName: e.target.value })}
                                className="glass-input w-full text-sm py-1.5"
                                placeholder="App"
                            />
                        </div>
                    </div>

                </div>

            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex gap-3">
                <button 
                    onClick={() => setExportModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-[2] py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {isExporting ? "Processing..." : "Download Package"}
                </button>
            </div>
        </div>
    </div>
  );
};

export default ExportModal;