import React from 'react';
import { cn } from '../../../lib/utils';
import { RotateCw, Lock, Star, MoreVertical, Plus, X } from 'lucide-react';

interface BrowserMockupProps {
  faviconUrl?: string;
  title?: string;
  url?: string;
  className?: string;
}

const BrowserMockup: React.FC<BrowserMockupProps> = ({ 
    faviconUrl, 
    title = "New Tab", 
    url = "https://example.com",
    className 
}) => {
  return (
    <div className={cn("rounded-xl overflow-hidden border border-black/20 font-sans shadow-2xl relative group", className)}>
        {/* Browser Top Bar (Chrome-ish) */}
        <div className="bg-[#202124] flex items-end px-2 pt-2 gap-1 relative z-10">
            {/* Inactive Tab */}
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 max-w-[150px] relative opacity-60 hover:opacity-100 transition-opacity cursor-default">
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                <span>Google</span>
                <div className="h-full w-[1px] bg-white/10 absolute right-0 top-1/2 -translate-y-1/2 h-4"></div>
            </div>

            {/* Active Tab */}
            <div className="relative bg-[#323639] rounded-t-lg px-3 py-2 text-xs text-slate-200 flex items-center gap-2 min-w-[160px] max-w-[200px] shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.5)] z-20">
                {/* Curve Connectors (Pseudo-element simulation) */}
                <div className="absolute bottom-0 -left-2 w-2 h-2 bg-transparent shadow-[2px_2px_0_#323639] rounded-br"></div>
                <div className="absolute bottom-0 -right-2 w-2 h-2 bg-transparent shadow-[-2px_2px_0_#323639] rounded-bl"></div>

                {faviconUrl ? (
                    <img src={faviconUrl} className="w-4 h-4 rounded-sm object-contain bg-white/5" alt="favicon" />
                ) : (
                    <div className="w-4 h-4 rounded-sm bg-slate-500 animate-pulse"></div>
                )}
                <span className="truncate flex-1">{title}</span>
                <button className="rounded hover:bg-white/10 p-0.5 ml-1 transition-colors">
                    <X size={12} />
                </button>
            </div>

            {/* New Tab Button */}
            <button className="p-1.5 hover:bg-white/10 rounded-full mb-1 ml-1 text-slate-400 transition-colors">
                <Plus size={16} />
            </button>
        </div>

        {/* Browser Toolbar (Address Bar) */}
        <div className="bg-[#323639] p-2 flex items-center gap-3 border-b border-black/20 relative z-0">
            <div className="flex gap-4 text-slate-400 px-1">
                 <button className="hover:text-white transition-colors"><RotateCw size={14} className="scale-x-[-1]" /></button>
                 <button className="hover:text-white transition-colors"><RotateCw size={14} /></button>
                 <button className="hover:text-white transition-colors"><RotateCw size={14} /></button>
            </div>
            
            <div className="flex-1 bg-[#202124] rounded-full px-4 py-1.5 text-xs text-slate-400 flex items-center gap-2 border border-transparent focus-within:border-brand-500/50 transition-colors">
                <Lock size={10} className="text-green-500" />
                <span className="flex-1 truncate select-none">{url}</span>
                <Star size={12} className="hover:text-yellow-400 cursor-pointer transition-colors" />
            </div>

            <div className="flex gap-3 text-slate-400 px-1">
                 <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">A</div>
                 <button className="hover:text-white transition-colors"><MoreVertical size={16} /></button>
            </div>
        </div>

        {/* Browser Content */}
        <div className="bg-[#202124] h-48 w-full flex flex-col items-center justify-center text-slate-600 text-sm relative overflow-hidden">
             
            {/* Subtle Grid Background */}
             <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
            />

            <div className="z-10 text-center animate-in fade-in zoom-in-95 duration-700">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-200 to-slate-600 bg-clip-text text-transparent mb-2">
                    {title}
                </h1>
                <p className="text-slate-500 text-xs max-w-[200px] mx-auto leading-relaxed">
                    This is how your favicon will look in a clear, modern browser interface.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                    <div className="custom-skeleton w-24 h-8 rounded-md bg-white/5"></div>
                    <div className="custom-skeleton w-24 h-8 rounded-md bg-brand-500/20"></div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BrowserMockup;
