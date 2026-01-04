import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Filter, ChevronRight, ArrowUpDown, Globe, Tag } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { fetchGoogleFonts, GoogleFont, loadFont } from '../../../lib/googleFonts';

interface FontPickerProps {
    currentFont: string;
    onChange: (font: string) => void;
    customFonts?: string[];
    defaultFonts?: string[];
}

const CATEGORIES = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'];
const SORTS = ['popularity', 'alpha', 'date', 'trending'];
const SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext', 'greek', 'greek-ext', 'vietnamese'];

type FilterType = 'all' | 'google' | 'custom' | 'default';

// Collapsible Filter Section Component
const FilterSection = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-white/5 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 text-[10px] text-slate-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider font-semibold"
            >
                <div className="flex items-center gap-2">
                    <Icon size={12} />
                    {title}
                </div>
                <ChevronRight size={12} className={cn("transition-transform", isOpen ? "rotate-90" : "")} />
            </button>
            {isOpen && <div className="p-2 pt-0 gap-1 flex flex-wrap animate-in slide-in-from-top-1 duration-200">{children}</div>}
        </div>
    );
};

// Component to Render a Single Font Item
const FontItem = ({ font, isSelected, onClick, isSystemOrCustom }: { font: GoogleFont, isSelected: boolean, onClick: () => void, isSystemOrCustom?: boolean }) => {
    const [loaded, setLoaded] = useState(false);
    const itemRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isSystemOrCustom) {
            setLoaded(true);
            return;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                const fontName = `Preview_${font.family.replace(/ /g, '_')}`;
                if (!document.fonts.check(`12px "${fontName}"`)) {
                   // robust URL finding
                   const fileUrl = font.menu || font.files?.regular || font.files?.['400'] || Object.values(font.files || {})[0];
                   if (fileUrl) {
                       const secureUrl = fileUrl.replace('http:', 'https:');
                       const fontFace = new FontFace(fontName, `url(${secureUrl})`);
                       fontFace.load().then((loadedFace) => {
                           document.fonts.add(loadedFace);
                           setLoaded(true);
                       }).catch((e) => {
                           console.warn(`Failed to load preview for ${font.family}`, e);
                           setLoaded(false); 
                       });
                   } else {
                       setLoaded(false);
                   }
                } else {
                    setLoaded(true);
                }
                observer.disconnect();
            }
        });

        if (itemRef.current) observer.observe(itemRef.current);
        return () => observer.disconnect();
    }, [font.family, font.menu, font.files, isSystemOrCustom]);

    return (
        <button
            ref={itemRef}
            onClick={onClick}
            className={cn(
                "w-full text-left px-3 py-2 rounded hover:bg-white/10 transition-colors flex items-center justify-between group flex-shrink-0",
                isSelected ? "bg-brand-500/20 text-brand-400" : "text-slate-300"
            )}
        >
            <div className="flex flex-col overflow-hidden">
                 {/* Main Title - Rendered in the Font Itself */}
                <span 
                    style={{ fontFamily: loaded ? (isSystemOrCustom ? font.family : `Preview_${font.family.replace(/ /g, '_')}`) : 'sans-serif' }}
                    className="text-lg truncate pr-4 leading-tight"
                >
                    {font.family}
                </span>
                {/* Safe Name Subtitle (so user knows what it is even if unreadable) */}
                <span className="text-[9px] text-slate-600 font-mono truncate">
                    {font.family} {isSystemOrCustom ? `(${font.category})` : ''}
                </span>
            </div>
            {isSelected && <Check size={14} className="flex-shrink-0 text-brand-400" />}
        </button>
    );
};

// Chip Component
const Chip = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: (e: React.MouseEvent) => void }) => (
    <button
        type="button"
        onMouseDown={(e) => {
             // Use onMouseDown to trigger before the "click outside" listener which is also on mousedown
             // and prevent the dropdown from closing if the user clicks a filter
             e.preventDefault();
             e.stopPropagation();
        }}
        onClick={onClick}
        className={cn(
            "px-2 py-1 rounded text-[10px] capitalize border transition-colors flex-shrink-0 cursor-pointer select-none",
            isActive
                ? "bg-brand-500/20 text-brand-400 border-brand-500/50"
                : "bg-white/5 text-slate-400 border-transparent hover:bg-white/10"
        )}
    >
        {label}
    </button>
);

const FontPicker: React.FC<FontPickerProps> = ({ currentFont, onChange, customFonts = [], defaultFonts = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [displayLimit, setDisplayLimit] = useState(20);

    // Filter States
    const [typeFilter, setTypeFilter] = useState<FilterType>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [subsetFilter, setSubsetFilter] = useState<string>('all');
    const [sortOption, setSortOption] = useState<string>('popularity');
    const [googleFonts, setGoogleFonts] = useState<GoogleFont[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Initial Fetch
    useEffect(() => {
        if (isOpen && googleFonts.length === 0) {
            setLoading(true);
            fetchGoogleFonts(sortOption as any).then(data => {
                setGoogleFonts(data);
                setLoading(false);
            });
        } 
        // Refetch if sort changes for Google Fonts (API handles sorting better)
        else if (isOpen && sortOption !== 'alpha' && googleFonts.length > 0) {
            // Only refetch if we really need to (popularity/date/trending is API side)
            // Note: client side sorting for everything else
             fetchGoogleFonts(sortOption as any).then(setGoogleFonts);
        }
    }, [isOpen, sortOption]);

    // Handle Infinite Scroll
    const handleScroll = () => {
        if (listRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = listRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 200) {
                setDisplayLimit(prev => prev + 20);
            }
        }
    };

    // Unified Data & Filtering
    const filteredFonts = useMemo(() => {
        // 1. Combine Sources
        const defaults: GoogleFont[] = defaultFonts.map(f => ({
            family: f, category: 'default', variants: [], subsets: [], version: '', lastModified: '', files: {}, kind: 'local'
        }));
        const customs: GoogleFont[] = customFonts.map(f => ({
            family: f, category: 'custom', variants: [], subsets: [], version: '', lastModified: '', files: {}, kind: 'local'
        }));
        
        const seen = new Set();
        let all: GoogleFont[] = [];
        const combined = [...customs, ...defaults, ...googleFonts];

        if (typeFilter === 'all') all = combined;
        else if (typeFilter === 'custom') all = customs;
        else if (typeFilter === 'default') all = defaults;
        else if (typeFilter === 'google') all = googleFonts;
        else all = combined; // Fallback

        // 1.5 Deduplicate by family name
        all = all.filter(font => {
            const normalized = font.family.toLowerCase().trim();
            if (seen.has(normalized)) return false;
            seen.add(normalized);
            return true;
        });

        // 2. Filter
        return all.filter(font => {
            // Search
            const matchesSearch = font.family.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Category (Only applies to Google Fonts mostly, but we can map default/custom if needed)
            if (categoryFilter !== 'all') {
                if (font.kind === 'local') return true; // Don't filter local by category strictly unless we tagged them
                if (font.category !== categoryFilter) return false;
            }

            // Subset (Only Google)
            if (subsetFilter !== 'all') {
                 if (font.kind === 'local') return true;
                 if (!font.subsets.includes(subsetFilter)) return false;
            }

            return true;
        });
    }, [googleFonts, customFonts, defaultFonts, typeFilter, categoryFilter, subsetFilter, searchTerm]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (font: GoogleFont) => {
        if (font.kind !== 'local') {
            loadFont(font.family, font);
        }
        onChange(font.family);
        setIsOpen(false);
    };



    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger remains same */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-2 flex items-center justify-between hover:border-white/20 transition-colors group"
            >
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm text-white truncate font-medium w-full text-left">{currentFont}</span>
                    <span className="text-[9px] text-slate-500 font-mono">
                         {customFonts.includes(currentFont) ? 'Custom' : defaultFonts.includes(currentFont) ? 'Default' : 'Google Font'}
                    </span>
                </div>
                <ChevronDown size={14} className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
            </button>

            {/* Dropdown - Fixed positioning class 'right-0' to prevent clipping */}
            {isOpen && (
                <div className="absolute top-[110%] right-0 w-72 xs:w-80 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 origin-top-right flex flex-col max-h-[600px]">
                    
                    {/* Header: Search */}
                    <div className="p-3 border-b border-white/10 bg-[#1e1e1e]">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search all fonts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-brand-500 outline-none"
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expandable Filters */}
                    <div className="overflow-y-auto max-h-[200px] border-b border-white/10 bg-[#181818] flex-shrink-0">
                        <FilterSection title="Source" icon={Globe} defaultOpen>
                            {['all', 'google', 'custom', 'default'].map(t => (
                                <Chip key={t} label={t} isActive={typeFilter === t} onClick={() => setTypeFilter(t as FilterType)} />
                            ))}
                        </FilterSection>

                        <FilterSection title="Category" icon={Tag}>
                            <Chip label="All" isActive={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
                            {CATEGORIES.map(c => (
                                <Chip key={c} label={c} isActive={categoryFilter === c} onClick={() => setCategoryFilter(c)} />
                            ))}
                        </FilterSection>

                         <FilterSection title="Subsets" icon={Globe}>
                            <Chip label="All" isActive={subsetFilter === 'all'} onClick={() => setSubsetFilter('all')} />
                            {SUBSETS.map(s => (
                                <Chip key={s} label={s} isActive={subsetFilter === s} onClick={() => setSubsetFilter(s)} />
                            ))}
                        </FilterSection>

                        <FilterSection title="Sort By" icon={ArrowUpDown}>
                            {SORTS.map(s => (
                                <Chip key={s} label={s} isActive={sortOption === s} onClick={() => setSortOption(s)} />
                            ))}
                        </FilterSection>
                    </div>

                    {/* Font List */}
                    <div
                        ref={listRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-[250px] bg-[#1e1e1e]"
                    >
                        {loading && googleFonts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                                <span className="loading loading-spinner loading-sm"></span>
                                <span className="text-xs">Fetching Fonts...</span>
                            </div>
                        ) : filteredFonts.length > 0 ? (
                            <>
                                <div className="px-2 py-1 text-[9px] text-slate-500 font-medium uppercase tracking-wider flex justify-between">
                                    <span>{filteredFonts.length} Fonts</span>
                                    <span>{sortOption}</span>
                                </div>
                                {filteredFonts.slice(0, displayLimit).map((font) => (
                                    <FontItem
                                        key={font.family}
                                        font={font}
                                        isSelected={currentFont === font.family}
                                        onClick={() => handleSelect(font)}
                                        isSystemOrCustom={font.kind === 'local'}
                                    />
                                ))}
                                {filteredFonts.length > displayLimit && (
                                    <div className="py-4 text-center text-[10px] text-slate-600">
                                        Scroll for more
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                                <Filter size={24} className="opacity-30" />
                                <span className="text-xs font-medium">No fonts match filters</span>
                                <button 
                                    onClick={() => {
                                        setSearchTerm('');
                                        setTypeFilter('all');
                                        setCategoryFilter('all');
                                        setSubsetFilter('all');
                                    }}
                                    className="text-[10px] text-brand-400 hover:underline mt-2"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="p-2 border-t border-white/10 bg-black/20 text-[9px] text-slate-600 flex justify-between px-4">
                        <span>Powered by Google Fonts</span>
                        <span>v1.0</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FontPicker;
