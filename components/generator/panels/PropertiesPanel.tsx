import React, { useRef, useState, useEffect } from 'react';
import FontPicker from './FontPicker';
import { useEditorStore } from '../../../store/editorStore';
import { HexColorPicker } from 'react-colorful';
import { cn, readFileAsBase64 } from '../../../lib/utils';
import { Palette, X, Bold, Italic, Underline, Strikethrough, Image as ImageIcon, Maximize, Minimize, Move, Plus, Trash2, Link, Link2Off, Layers, Sparkles, Upload } from 'lucide-react';
import { FillType, GradientConfig, ShapeLayer, TextLayer, ImageFillMode } from '../../../types';
import { suggestGradient, isAIConfigured } from '../../../lib/ai/geminiClient';
import { toast } from 'sonner';

const INITIAL_FONTS = ['Inter', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact', 'Comic Sans MS'];

// --- CONSTANTS ---
const PRESET_GRADIENTS: GradientConfig[] = [
    { type: 'linear', angle: 135, stops: [{ id: '1', offset: 0, color: '#f6d365' }, { id: '2', offset: 1, color: '#fda085' }] }, // Sunny
    { type: 'linear', angle: 135, stops: [{ id: '1', offset: 0, color: '#84fab0' }, { id: '2', offset: 1, color: '#8fd3f4' }] }, // Ocean
    { type: 'linear', angle: 135, stops: [{ id: '1', offset: 0, color: '#a18cd1' }, { id: '2', offset: 1, color: '#fbc2eb' }] }, // Berry
    { type: 'linear', angle: 135, stops: [{ id: '1', offset: 0, color: '#ff9a9e' }, { id: '2', offset: 1, color: '#fecfef' }] }, // Flamingo
    { type: 'linear', angle: 90, stops: [{ id: '1', offset: 0, color: '#e0c3fc' }, { id: '2', offset: 1, color: '#8ec5fc' }] }, // Lavender
    { type: 'linear', angle: 45, stops: [{ id: '1', offset: 0, color: '#43e97b' }, { id: '2', offset: 1, color: '#38f9d7' }] }, // Mint
];

// --- SUB-COMPONENTS ---

const PalettePresets = ({ onSelect }: { onSelect: (g: GradientConfig) => void }) => (
    <div className="grid grid-cols-6 gap-1.5 mb-3">
        {PRESET_GRADIENTS.map((g, i) => (
            <button
                key={i}
                onClick={() => onSelect(g)}
                className="w-full aspect-square rounded-full border border-white/10 hover:border-white/50 hover:scale-110 transition-all shadow-sm"
                style={{ background: `linear-gradient(${g.angle}deg, ${g.stops[0].color}, ${g.stops[1].color})` }}
                title="Apply Preset"
            />
        ))}
    </div>
);

const GradientEditor = ({ gradient, onChange }: { gradient: GradientConfig, onChange: (g: GradientConfig) => void }) => {
    const [loading, setLoading] = useState(false);

    const handleSuggest = async () => {
        if (!isAIConfigured()) {
            toast.error("AI Key missing (.env)");
            return;
        }
        setLoading(true);
        const newGradient = await suggestGradient("Modern app icon background");
        setLoading(false);
        if (newGradient) {
            onChange(newGradient);
            toast.success("AI suggested a gradient!");
        } else {
            toast.error("Failed to suggest gradient");
        }
    };

    return (
        <div className="space-y-4 bg-black/20 p-3 rounded-lg border border-white/5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-500 font-medium">Presets</span>
                {isAIConfigured() && (
                    <button
                        onClick={handleSuggest}
                        disabled={loading}
                        className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
                    >
                        <Sparkles size={10} />
                        {loading ? 'Thinking...' : 'AI Suggest'}
                    </button>
                )}
            </div>
            <PalettePresets onSelect={onChange} />
            <div className="flex gap-2 mb-2">
                <button
                    onClick={() => onChange({ ...gradient, type: 'linear' })}
                    className={cn("flex-1 py-1 text-[10px] rounded border transition-colors", gradient.type === 'linear' ? "bg-brand-500 border-brand-400 text-white" : "bg-white/5 border-white/5 text-slate-400")}
                >Linear</button>
                <button
                    onClick={() => onChange({ ...gradient, type: 'radial' })}
                    className={cn("flex-1 py-1 text-[10px] rounded border transition-colors", gradient.type === 'radial' ? "bg-brand-500 border-brand-400 text-white" : "bg-white/5 border-white/5 text-slate-400")}
                >Radial</button>
            </div>

            {gradient.type === 'linear' && (
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Angle ({gradient.angle}°)</label>
                    <input
                        type="range" min="0" max="360" value={gradient.angle}
                        onChange={(e) => onChange({ ...gradient, angle: Number(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            )}

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400">Color Stops</label>
                    <button
                        onClick={() => onChange({ ...gradient, stops: [...gradient.stops, { id: Math.random().toString(), offset: 0.5, color: '#ffffff' }] })}
                        className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-300 hover:text-white flex items-center gap-1"
                    >
                        <Plus size={10} /> Add
                    </button>
                </div>
                {gradient.stops.map((stop, idx) => (
                    <div key={stop.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border border-white/10 relative overflow-hidden flex-shrink-0">
                            <input
                                type="color" value={stop.color}
                                onChange={(e) => {
                                    const newStops = [...gradient.stops];
                                    newStops[idx].color = e.target.value;
                                    onChange({ ...gradient, stops: newStops });
                                }}
                                className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                            />
                        </div>
                        <input
                            type="range" min="0" max="1" step="0.01" value={stop.offset}
                            onChange={(e) => {
                                const newStops = [...gradient.stops];
                                newStops[idx].offset = Number(e.target.value);
                                onChange({ ...gradient, stops: newStops });
                            }}
                            className="flex-grow h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                        {gradient.stops.length > 2 && (
                            <button
                                onClick={() => onChange({ ...gradient, stops: gradient.stops.filter((_, i) => i !== idx) })}
                                className="text-slate-500 hover:text-red-400"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

const FillControl = ({
    label,
    fillType,
    solidColor,
    gradientConfig,
    hasImage,
    onTypeChange,
    onSolidChange,
    onGradientChange,
    onImageUpload
}: any) => {
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-3">
            <label className="text-xs text-slate-400 font-medium">{label}</label>

            {/* Tabs */}
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                {(['solid', 'gradient', 'image', 'none'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => onTypeChange(type)}
                        className={cn(
                            "flex-1 py-1.5 text-[10px] rounded transition-all capitalize flex items-center justify-center gap-1",
                            fillType === type ? "bg-white/10 text-white shadow-sm font-medium" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {type === 'solid' && <div className="w-2 h-2 rounded-full bg-current" />}
                        {type === 'gradient' && <div className="w-2 h-2 rounded-full bg-gradient-to-tr from-white to-transparent" />}
                        {type === 'image' && <ImageIcon size={10} />}
                        {type === 'none' && <X size={10} />}
                        <span className="hidden xl:inline">{type}</span>
                    </button>
                ))}
            </div>

            {/* Controls based on Type */}
            {fillType === 'solid' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <HexColorPicker color={solidColor} onChange={onSolidChange} style={{ width: '100%', height: '120px' }} />
                    <div className="flex items-center gap-2 mt-2 bg-black/20 p-2 rounded border border-white/5">
                        <div className="w-4 h-4 rounded bg-current" style={{ color: solidColor }} />
                        <input
                            type="text" value={solidColor}
                            onChange={(e) => onSolidChange(e.target.value)}
                            className="bg-transparent text-xs text-white font-mono outline-none w-full"
                        />
                    </div>
                </div>
            )}

            {fillType === 'gradient' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <GradientEditor gradient={gradientConfig} onChange={onGradientChange} />
                </div>
            )}

            {fillType === 'image' && (
                <div className="animate-in fade-in zoom-in-95 duration-200 space-y-2">
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="h-24 rounded-lg border border-dashed border-white/20 hover:border-brand-500/50 hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors relative overflow-hidden"
                    >
                        {hasImage ? (
                            <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                                <span className="text-xs text-brand-300 font-medium bg-black/50 px-2 py-1 rounded">Change Image</span>
                            </div>
                        ) : (
                            <>
                                <ImageIcon size={20} className="text-slate-400" />
                                <span className="text-xs text-slate-500">Click to Upload</span>
                            </>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} className="hidden" />
                    </div>
                </div>
            )}
        </div>
    )
}

interface ImageSettingsProps {
    mode: ImageFillMode;
    zoom: number;
    x?: number;
    y?: number;
    onModeChange: (m: ImageFillMode) => void;
    onZoomChange: (z: number) => void;
    onXChange: (x: number) => void;
    onYChange: (y: number) => void;
}

const ImageSettings = ({ mode, zoom, x = 0, y = 0, onModeChange, onZoomChange, onXChange, onYChange }: ImageSettingsProps) => (
    <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-4 animate-in fade-in zoom-in-95">
        <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Fit Mode</label>
            <div className="grid grid-cols-2 gap-1">
                {(['cover', 'contain', 'stretch', 'custom'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => onModeChange(m)}
                        className={cn("text-xs py-1.5 px-2 rounded border transition-colors capitalize", mode === m ? "bg-brand-500 text-white border-brand-400" : "bg-black/20 text-slate-400 border-transparent hover:bg-white/5")}
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>
        <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider">Zoom</label>
            <input
                type="range" min="0.1" max="3" step="0.05"
                value={zoom || 1}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Offset X</label>
                <input
                    type="number" value={x}
                    onChange={(e) => onXChange(Number(e.target.value))}
                    className="glass-input w-full text-xs py-1"
                />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Offset Y</label>
                <input
                    type="number" value={y}
                    onChange={(e) => onYChange(Number(e.target.value))}
                    className="glass-input w-full text-xs py-1"
                />
            </div>
        </div>
    </div>
);

// Component for editable dimensions
const DimensionInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => {
    const [localValue, setLocalValue] = useState(value.toString());

    useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleBlur = () => {
        let num = parseInt(localValue, 10);
        if (isNaN(num) || num < 1) num = value; // revert on invalid
        onChange(num);
        setLocalValue(num.toString());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="relative group">
            <input
                type="number"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-black/40 border border-transparent focus:border-brand-500 rounded p-2 text-center text-xs text-white outline-none transition-all"
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 pointer-events-none font-medium">{label}</span>
        </div>
    );
};

const PropertiesPanel: React.FC = () => {
    const { layers, selectedLayerId, updateLayer, canvasConfig, setCanvasBackground, setCanvasConfig, saveHistory } = useEditorStore();
    const selectedLayer = layers.find(l => l.id === selectedLayerId);
    const [activeTab, setActiveTab] = React.useState<'style' | 'transform'>('style');
    const [aspectLocked, setAspectLocked] = React.useState(true);
    const [customFonts, setCustomFonts] = React.useState<string[]>([]);
    const fontInputRef = useRef<HTMLInputElement>(null);

    const handleFontUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            const fontName = file.name.split('.')[0];
            const fontFace = new FontFace(fontName, buffer);
            await fontFace.load();
            document.fonts.add(fontFace);
            setCustomFonts(prev => [...prev, fontName]);

            if (selectedLayerId && selectedLayer?.type === 'text') {
                updateLayer(selectedLayerId, { fontFamily: fontName }, true);
            }
            toast.success(`Font "${fontName}" added!`);
        } catch (e) {
            toast.error("Failed to load font");
            console.error(e);
        }
    };

    // --- CANVAS SETTINGS (No selection) ---
    if (!selectedLayer) {
        const handleBgTypeChange = (type: FillType) => {
            setCanvasConfig({ backgroundType: type }, true);
        };
        const handleGradientChange = (g: GradientConfig) => {
            setCanvasConfig({ backgroundGradient: g });
        };
        const handleCanvasImageUpload = async (file: File) => {
            try {
                const base64 = await readFileAsBase64(file);
                setCanvasConfig({ backgroundImage: base64, backgroundType: 'image', backgroundImageMode: 'cover', backgroundPatternScale: 1 }, true);
            } catch (e) { console.error(e); }
        };

        return (
            <div className="h-full flex flex-col p-4 space-y-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-4 flex items-center gap-2">
                    <Layers size={14} /> Canvas
                </h3>

                <FillControl
                    label="Background"
                    fillType={canvasConfig.backgroundType}
                    solidColor={canvasConfig.background}
                    gradientConfig={canvasConfig.backgroundGradient || { type: 'linear', angle: 90, stops: [] }}
                    hasImage={!!canvasConfig.backgroundImage}
                    onTypeChange={handleBgTypeChange}
                    onSolidChange={(c: string) => setCanvasBackground(c)}
                    onGradientChange={handleGradientChange}
                    onImageUpload={handleCanvasImageUpload}
                />

                {canvasConfig.backgroundType === 'image' && canvasConfig.backgroundImage && (
                    <ImageSettings
                        mode={canvasConfig.backgroundImageMode || 'cover'}
                        zoom={canvasConfig.backgroundPatternScale || 1}
                        x={canvasConfig.backgroundPatternX || 0}
                        y={canvasConfig.backgroundPatternY || 0}
                        onModeChange={(m) => setCanvasConfig({ backgroundImageMode: m }, true)}
                        onZoomChange={(z) => setCanvasConfig({ backgroundPatternScale: z })}
                        onXChange={(x) => setCanvasConfig({ backgroundPatternX: x })}
                        onYChange={(y) => setCanvasConfig({ backgroundPatternY: y })}
                    />
                )}

                <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400">Resolution</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DimensionInput
                            label="W"
                            value={canvasConfig.width}
                            onChange={(w) => setCanvasConfig({ width: w }, true)}
                        />
                        <DimensionInput
                            label="H"
                            value={canvasConfig.height}
                            onChange={(h) => setCanvasConfig({ height: h }, true)}
                        />
                    </div>
                    <p className="text-[10px] text-slate-500">Working resolution (pixels).</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-400">Border Radius</label>
                        <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                            {canvasConfig.cornerRadius || 0}px
                        </span>
                    </div>
                    <input
                        type="range" min="0" max={Math.min(canvasConfig.width, canvasConfig.height) / 2}
                        value={canvasConfig.cornerRadius || 0}
                        onChange={(e) => setCanvasConfig({ cornerRadius: Number(e.target.value) }, true)}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        );
    }

    // --- LAYER SETTINGS ---

    const handlePatternUpload = async (file: File) => {
        try {
            const base64 = await readFileAsBase64(file);
            updateLayer(selectedLayer.id, {
                fillPatternImage: base64,
                fillType: 'image',
                fillImageMode: 'cover',
                fillPatternScale: 1
            }, true);
        } catch (e) { console.error(e); }
    }

    const toggleFontStyle = (style: string) => {
        if (selectedLayer.type !== 'text') return;
        const current = selectedLayer.fontStyle || 'normal';
        let newStyle = current;
        if (style === 'bold') newStyle = current.includes('bold') ? current.replace('bold', '').trim() : `${current} bold`.trim();
        if (style === 'italic') newStyle = current.includes('italic') ? current.replace('italic', '').trim() : `${current} italic`.trim();
        if (!newStyle) newStyle = 'normal';
        updateLayer(selectedLayer.id, { fontStyle: newStyle }, true);
    }

    const toggleDecoration = (style: string) => {
        if (selectedLayer.type !== 'text') return;
        const current = selectedLayer.textDecoration || '';
        let newStyle = current;
        if (current.includes(style)) newStyle = current.replace(style, '').trim();
        else newStyle = `${current} ${style}`.trim();
        updateLayer(selectedLayer.id, { textDecoration: newStyle }, true);
    }

    const handleScaleChange = (axis: 'x' | 'y', val: number) => {
        const updates: Partial<typeof selectedLayer> = {};
        if (axis === 'x') {
            updates.scaleX = val;
            if (aspectLocked && selectedLayer.scaleX !== 0) {
                updates.scaleY = val * (selectedLayer.scaleY / selectedLayer.scaleX);
            }
        } else {
            updates.scaleY = val;
            if (aspectLocked && selectedLayer.scaleY !== 0) {
                updates.scaleX = val * (selectedLayer.scaleX / selectedLayer.scaleY);
            }
        }
        updateLayer(selectedLayer.id, updates, true);
    };

    const isCircle = selectedLayer.type === 'shape' && (selectedLayer as ShapeLayer).shapeType === 'circle';
    const isStar = selectedLayer.type === 'shape' && (selectedLayer as ShapeLayer).shapeType === 'star';
    const isLine = selectedLayer.type === 'shape' && (selectedLayer as ShapeLayer).shapeType === 'line';
    const hasCornerRadius = (selectedLayer.type === 'shape' && !isCircle && !isStar);

    return (
        <div className="h-full flex flex-col" onMouseUp={() => saveHistory()}>
            <div className="flex border-b border-white/10 bg-[#1e1e1e] z-10">
                {['style', 'transform'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn("flex-1 py-3 text-xs font-medium transition-colors capitalize", activeTab === tab ? "text-brand-400 border-b-2 border-brand-400" : "text-slate-400 hover:text-white")}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {activeTab === 'style' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">

                        {/* TEXT SPECIFIC */}
                        {selectedLayer.type === 'text' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Content</label>
                                    <textarea
                                        value={selectedLayer.text}
                                        onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                                        onBlur={() => saveHistory()}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-brand-500 outline-none resize-none"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-slate-400">Font Family</label>
                                        <button
                                            onClick={() => fontInputRef.current?.click()}
                                            className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
                                            title="Upload .ttf or .otf"
                                        >
                                            <Upload size={10} /> Add Font
                                        </button>
                                        <input
                                            type="file"
                                            ref={fontInputRef}
                                            className="hidden"
                                            accept=".ttf,.otf,.woff,.woff2"
                                            onChange={handleFontUpload}
                                        />
                                    </div>

                                    <FontPicker
                                        currentFont={selectedLayer.fontFamily}
                                        onChange={(font) => updateLayer(selectedLayer.id, { fontFamily: font }, true)}
                                        customFonts={customFonts}
                                        defaultFonts={INITIAL_FONTS}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => toggleFontStyle('bold')} className={cn("p-2 rounded flex-1 border", selectedLayer.fontStyle?.includes('bold') ? "bg-brand-500/20 text-brand-400 border-brand-500/50" : "bg-white/5 border-white/10 text-slate-400")}><Bold size={16} className="mx-auto" /></button>
                                    <button onClick={() => toggleFontStyle('italic')} className={cn("p-2 rounded flex-1 border", selectedLayer.fontStyle?.includes('italic') ? "bg-brand-500/20 text-brand-400 border-brand-500/50" : "bg-white/5 border-white/10 text-slate-400")}><Italic size={16} className="mx-auto" /></button>
                                    <button onClick={() => toggleDecoration('underline')} className={cn("p-2 rounded flex-1 border", selectedLayer.textDecoration?.includes('underline') ? "bg-brand-500/20 text-brand-400 border-brand-500/50" : "bg-white/5 border-white/10 text-slate-400")}><Underline size={16} className="mx-auto" /></button>
                                    <button onClick={() => toggleDecoration('line-through')} className={cn("p-2 rounded flex-1 border", selectedLayer.textDecoration?.includes('line-through') ? "bg-brand-500/20 text-brand-400 border-brand-500/50" : "bg-white/5 border-white/10 text-slate-400")}><Strikethrough size={16} className="mx-auto" /></button>
                                </div>
                            </>
                        )}

                        {/* FILL CONTROLS (Common for Text & Shape) */}
                        <FillControl
                            label="Fill"
                            fillType={(selectedLayer as ShapeLayer | TextLayer).fillType || 'solid'}
                            solidColor={(selectedLayer as ShapeLayer | TextLayer).fill}
                            gradientConfig={(selectedLayer as ShapeLayer | TextLayer).gradient || { type: 'linear', angle: 90, stops: [{ id: '1', offset: 0, color: '#000' }, { id: '2', offset: 1, color: '#fff' }] }}
                            hasImage={!!(selectedLayer as ShapeLayer | TextLayer).fillPatternImage}
                            onTypeChange={(type: FillType) => updateLayer(selectedLayer.id, { fillType: type }, true)}
                            onSolidChange={(c: string) => updateLayer(selectedLayer.id, { fill: c })}
                            onGradientChange={(g: GradientConfig) => updateLayer(selectedLayer.id, { gradient: g })}
                            onImageUpload={handlePatternUpload}
                        />

                        {/* Image Mode Settings */}
                        {(selectedLayer as any).fillType === 'image' && (selectedLayer as any).fillPatternImage && (
                            <ImageSettings
                                mode={(selectedLayer as any).fillImageMode || 'cover'}
                                zoom={(selectedLayer as any).fillPatternScale || 1}
                                x={(selectedLayer as any).fillPatternX || 0}
                                y={(selectedLayer as any).fillPatternY || 0}
                                onModeChange={(m) => updateLayer(selectedLayer.id, { fillImageMode: m }, true)}
                                onZoomChange={(z) => updateLayer(selectedLayer.id, { fillPatternScale: z })}
                                onXChange={(x) => updateLayer(selectedLayer.id, { fillPatternX: x })}
                                onYChange={(y) => updateLayer(selectedLayer.id, { fillPatternY: y })}
                            />
                        )}

                        {/* STROKE / BORDER */}
                        {(selectedLayer.type === 'shape' || selectedLayer.type === 'text') && (
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-slate-400 font-medium">Stroke</label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                                            {(selectedLayer as any).strokeWidth || 0}px
                                        </span>
                                        <div className="flex items-center gap-2 relative">
                                            <div
                                                className="w-8 h-8 rounded-lg bg-current border border-white/20 cursor-pointer hover:scale-105 transition-transform shadow-lg"
                                                style={{ color: (selectedLayer as any).stroke || '#ffffff' }}
                                                onClick={() => document.getElementById('stroke-picker')?.click()}
                                            />
                                            <input
                                                type="color"
                                                value={(selectedLayer as any).stroke || '#ffffff'}
                                                onChange={(e) => updateLayer(selectedLayer.id, { stroke: e.target.value })}
                                                onBlur={() => saveHistory()}
                                                className="invisible w-0 h-0 absolute"
                                                id="stroke-picker"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="range" min="0" max="20"
                                    value={(selectedLayer as any).strokeWidth || 0}
                                    onChange={(e) => updateLayer(selectedLayer.id, { strokeWidth: Number(e.target.value) })}
                                    onMouseUp={() => saveHistory()}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}

                        {/* CORNER RADIUS (All Shapes except Circle) */}
                        {hasCornerRadius && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-slate-400">{isLine ? 'End Roundness' : 'Corner Radius'}</label>
                                    <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                                        {(selectedLayer as ShapeLayer).cornerRadius || 0}px
                                    </span>
                                </div>
                                <input
                                    type="range" min="0" max="150"
                                    value={(selectedLayer as ShapeLayer).cornerRadius || 0}
                                    onChange={(e) => updateLayer(selectedLayer.id, { cornerRadius: Number(e.target.value) })}
                                    onMouseUp={() => saveHistory()}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'transform' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">X Position</label>
                                <input type="number" value={Math.round(selectedLayer.x)} onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })} onBlur={() => saveHistory()} className="glass-input w-full text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">Y Position</label>
                                <input type="number" value={Math.round(selectedLayer.y)} onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })} onBlur={() => saveHistory()} className="glass-input w-full text-xs" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400">Rotation ({Math.round(selectedLayer.rotation)}°)</label>
                            <input type="range" min="0" max="360" value={selectedLayer.rotation} onChange={(e) => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })} onMouseUp={() => saveHistory()} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                        </div>

                        {/* SCALING with Chain */}
                        <div className="space-y-2">
                            <label className="text-xs text-slate-400 flex justify-between">
                                <span>Scale</span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAspectLocked(!aspectLocked);
                                    }}
                                    className={cn("p-1 rounded transition-colors cursor-pointer hover:bg-white/10", aspectLocked ? "bg-brand-500/20 text-brand-400 border border-brand-500/30" : "text-slate-500 border border-transparent")}
                                    title={aspectLocked ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                                >
                                    {aspectLocked ? <Link size={14} /> : <Link2Off size={14} />}
                                </button>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 relative">
                                    <span className="absolute left-2 top-1.5 text-[9px] text-slate-500">X</span>
                                    <input type="number" step="0.1" value={selectedLayer.scaleX.toFixed(2)} onChange={(e) => handleScaleChange('x', Number(e.target.value))} className="glass-input w-full text-xs pl-6" />
                                </div>
                                <div className="space-y-1 relative">
                                    <span className="absolute left-2 top-1.5 text-[9px] text-slate-500">Y</span>
                                    <input type="number" step="0.1" value={selectedLayer.scaleY.toFixed(2)} onChange={(e) => handleScaleChange('y', Number(e.target.value))} className="glass-input w-full text-xs pl-6" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-400">Opacity ({Math.round(selectedLayer.opacity * 100)}%)</label>
                            <input type="range" min="0" max="1" step="0.01" value={selectedLayer.opacity} onChange={(e) => updateLayer(selectedLayer.id, { opacity: Number(e.target.value) })} onMouseUp={() => saveHistory()} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertiesPanel;