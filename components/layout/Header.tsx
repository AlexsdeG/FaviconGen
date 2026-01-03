import React from 'react';
import { Layers, Github, Image, PenTool } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

const Header: React.FC = () => {
  const { mode, setMode } = useUIStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-2">
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-6 py-3 flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-brand-500/20 p-2 rounded-lg text-brand-500 border border-brand-500/30">
            <Layers size={24} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white hidden sm:block">
            Favicon<span className="text-brand-500">Gen</span>
          </h1>
        </div>

        {/* Central Navigation Tabs */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white/5 border border-white/10 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => setMode('converter')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 focus:outline-none",
                mode === 'converter'
                  ? "bg-brand-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Image size={16} />
              <span className="hidden sm:inline">Converter</span>
            </button>
            <button
              onClick={() => setMode('generator')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 focus:outline-none",
                mode === 'generator'
                  ? "bg-brand-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <PenTool size={16} />
              <span className="hidden sm:inline">Generator</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/AlexsdeG/FaviconGen"
            target="_blank"
            rel="noreferrer"
            className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:bg-white/10"
          >
            <Github size={20} />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;