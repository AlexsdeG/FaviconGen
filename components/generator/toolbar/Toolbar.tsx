import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../../store/editorStore';
import MagicIconModal from '../../modals/MagicIconModal';
import { Type, Box, Circle, Star, Square, Upload, Smile, ChevronDown, MousePointer2, Minus, Plus, Maximize, Undo2, Redo2, Triangle, Hexagon, Octagon, Download, Navigation, Sparkles, Magnet, Scaling } from 'lucide-react';
import { readFileAsBase64, cn } from '../../../lib/utils';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { ShapeType } from '../../../types';
import { isAIConfigured } from '../../../lib/ai/geminiClient';

interface ToolbarProps {
    onExport: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const Toolbar: React.FC<ToolbarProps> = ({ onExport }) => {
    const { addLayer, canvasConfig, centerSelection, stageConfig, setStageConfig, selectedLayerId, undo, redo, history, historyIndex, snapping, setSnappingOptions, isFreeScale, toggleFreeScale } = useEditorStore();
    const [showShapeMenu, setShowShapeMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMagicModal, setShowMagicModal] = useState(false);
    const [showSnappingMenu, setShowSnappingMenu] = useState(false);
    const emojiRef = useRef<HTMLDivElement>(null);
    const shapeRef = useRef<HTMLDivElement>(null);
    const snapRef = useRef<HTMLDivElement>(null);

    const spawnX = canvasConfig.width / 2;
    const spawnY = canvasConfig.height / 2;
    const hasAI = isAIConfigured();

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (shapeRef.current && !shapeRef.current.contains(event.target as Node)) {
                setShowShapeMenu(false);
            }
            if (snapRef.current && !snapRef.current.contains(event.target as Node)) {
                setShowSnappingMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleZoom = (delta: number) => {
        const newScale = Math.max(0.1, Math.min(5, stageConfig.scale + delta));
        setStageConfig({ ...stageConfig, scale: newScale });
    };

    const handleFit = () => {
        const containerH = window.innerHeight - 200;
        const scale = Math.min((window.innerWidth - 400) / canvasConfig.width, containerH / canvasConfig.height, 1);
        setStageConfig({ scale: scale, x: (window.innerWidth - 600 - canvasConfig.width * scale) / 2, y: 50 });
    };

    const handleAddText = () => {
        const w = 300;
        const h = 150;
        addLayer({
            id: generateId(),
            type: 'text',
            name: 'Text',
            text: 'Favicon',
            fontSize: 120,
            fontFamily: 'Inter',
            fill: '#000000',
            align: 'center',
            fontStyle: 'bold',
            textDecoration: '',
            visible: true,
            locked: false,
            x: spawnX,
            y: spawnY,
            offsetX: w / 2,
            offsetY: h / 2,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            width: w,
            height: h,
            fillType: 'solid'
        });
    };

    const handleAddEmoji = (emojiData: EmojiClickData) => {
        const size = 200;
        addLayer({
            id: generateId(),
            type: 'emoji',
            name: `Emoji ${emojiData.emoji}`,
            text: emojiData.emoji,
            fontSize: size,
            visible: true,
            locked: false,
            x: spawnX,
            y: spawnY,
            offsetX: size / 2,
            offsetY: size / 2,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            width: size,
            height: size
        });
        setShowEmojiPicker(false);
    };

    const handleAddShape = (type: ShapeType) => {
        const isLine = type === 'line';
        const w = isLine ? 300 : 300;
        const h = isLine ? 20 : 300;

        // Rect and Line (Rect-based) draw from top-left, so we offset them by w/2 to center anchor.
        // Circle, Star, and Polygons draw from center, so offset should be 0.
        const isTopLeftOrigin = type === 'rect' || type === 'line' || type === 'custom'; // Custom paths usually 0,0 based

        addLayer({
            id: generateId(),
            type: 'shape',
            shapeType: type,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            fillType: 'solid',
            fill: '#4f46e5',
            stroke: '#ffffff',
            strokeWidth: 0,
            visible: true,
            locked: false,
            x: spawnX,
            y: spawnY,
            offsetX: w / 2,
            offsetY: h / 2,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            width: w,
            height: h,
            cornerRadius: type === 'rect' ? 40 : (isLine ? 10 : 0)
        });
        setShowShapeMenu(false);
    };

    const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            readFileAsBase64(file).then((base64) => {
                const img = new Image();
                img.onload = () => {
                    const aspect = img.height / img.width;
                    const w = 400;
                    const h = 400 * aspect;
                    addLayer({
                        id: generateId(),
                        type: 'image',
                        name: file.name,
                        src: base64,
                        visible: true,
                        locked: false,
                        x: spawnX,
                        y: spawnY,
                        offsetX: w / 2,
                        offsetY: h / 2,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        opacity: 1,
                        width: w,
                        height: h
                    });
                };
                img.src = base64;
            });
        }
    };

    const ToolBtn = ({ icon: Icon, label, onClick, active, disabled, dropdown, title, iconClassName }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "group flex flex-col items-center justify-center gap-1.5 min-w-[60px] h-full relative outline-none",
                disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            )}
        >
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border",
                active
                    ? "bg-brand-500 text-white border-brand-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    : "bg-white/5 border-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white group-hover:border-white/20"
            )}>
                <Icon size={20} strokeWidth={2} className={iconClassName} />
                {dropdown && <ChevronDown size={10} className="absolute bottom-1 right-1 opacity-50" />}
            </div>
            <span className={cn(
                "text-[10px] font-medium tracking-wide transition-colors",
                active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
            )}>
                {label}
            </span>
        </button>
    );

    const ShapeItem = ({ type, icon: Icon, label }: { type: ShapeType, icon: any, label: string }) => (
        <button
            onClick={() => handleAddShape(type)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-colors group/item"
        >
            <div className="w-8 h-8 rounded bg-white/5 group-hover/item:bg-brand-500 flex items-center justify-center text-slate-300 group-hover/item:text-white transition-colors">
                <Icon size={16} />
            </div>
            <span className="text-[9px] text-slate-500 group-hover/item:text-slate-300">{label}</span>
        </button>
    );

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className="h-20 bg-[#141414]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-40 relative shadow-2xl">

            {/* Left Tools */}
            <div className="flex items-center gap-2 h-full py-2">
                <ToolBtn
                    icon={Navigation}
                    label="Center"
                    onClick={centerSelection}
                    disabled={!selectedLayerId}
                    title="Center Selected Element"
                    iconClassName="rotate-270"
                />

                <div className="relative h-full" ref={snapRef}>
                    <ToolBtn
                        icon={Magnet}
                        label="Snapping"
                        onClick={() => setShowSnappingMenu(!showSnappingMenu)}
                        active={showSnappingMenu}
                        dropdown
                        iconClassName={snapping.enabled ? "text-brand-400" : ""}
                    />

                    {showSnappingMenu && (
                        <div className="absolute top-[110%] left-0 w-48 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 origin-top-left z-50">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer bg-black/20">
                                    <input
                                        type="checkbox"
                                        checked={snapping.enabled}
                                        onChange={(e) => setSnappingOptions({ enabled: e.target.checked })}
                                        className="rounded border-white/20 bg-white/5 text-brand-500 focus:ring-0"
                                    />
                                    <span className="text-xs font-semibold text-white">Enable Snapping</span>
                                </label>

                                <div className="h-[1px] bg-white/10" />

                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <label className="flex items-center justify-between text-xs text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={snapping.grid}
                                                    onChange={(e) => setSnappingOptions({ grid: e.target.checked })}
                                                    disabled={!snapping.enabled}
                                                    className="rounded border-white/20 bg-white/5 text-brand-500 focus:ring-0 disabled:opacity-50"
                                                />
                                                <span>Grid Snap</span>
                                            </div>
                                        </label>
                                        <div className="flex items-center gap-2 pl-6">
                                            <input
                                                type="number"
                                                min="5"
                                                max="100"
                                                value={snapping.gridSize}
                                                onChange={(e) => setSnappingOptions({ gridSize: Number(e.target.value) })}
                                                disabled={!snapping.enabled || !snapping.grid}
                                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white disabled:opacity-30 outline-none focus:border-brand-500 transition-colors"
                                                placeholder="Size"
                                            />
                                            <span className="text-[10px] text-slate-500 w-8">px</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="flex items-center justify-between text-xs text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={snapping.rotation}
                                                    onChange={(e) => setSnappingOptions({ rotation: e.target.checked })}
                                                    disabled={!snapping.enabled}
                                                    className="rounded border-white/20 bg-white/5 text-brand-500 focus:ring-0 disabled:opacity-50"
                                                />
                                                <span>Angle Snap</span>
                                            </div>
                                        </label>
                                        <div className="flex items-center gap-2 pl-6">
                                            <input
                                                type="number"
                                                min="0"
                                                max="180"
                                                value={snapping.rotationIncrement}
                                                onChange={(e) => setSnappingOptions({ rotationIncrement: Number(e.target.value) })}
                                                disabled={!snapping.enabled || !snapping.rotation}
                                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white disabled:opacity-30 outline-none focus:border-brand-500 transition-colors"
                                                placeholder="Angle"
                                            />
                                            <span className="text-[10px] text-slate-500 w-8">deg</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-white/10" />

                                <div className="space-y-1">
                                    <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={snapping.objects}
                                            onChange={(e) => setSnappingOptions({ objects: e.target.checked })}
                                            disabled={!snapping.enabled}
                                            className="rounded border-white/20 bg-white/5 text-brand-500 focus:ring-0 disabled:opacity-50"
                                        />
                                        <span className={cn("text-xs", !snapping.enabled ? "text-slate-600" : "text-slate-300")}>Snap to Objects</span>
                                    </label>

                                    <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={snapping.canvas}
                                            onChange={(e) => setSnappingOptions({ canvas: e.target.checked })}
                                            disabled={!snapping.enabled}
                                            className="rounded border-white/20 bg-white/5 text-brand-500 focus:ring-0 disabled:opacity-50"
                                        />
                                        <span className={cn("text-xs", !snapping.enabled ? "text-slate-600" : "text-slate-300")}>Snap to Canvas</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ToolBtn
                    icon={Maximize}
                    label="Free Scale"
                    onClick={toggleFreeScale}
                    active={isFreeScale}
                    iconClassName={isFreeScale ? "text-brand-400" : ""}
                    title="Toggle Free Scale Mode (Ignore Aspect Ratio)"
                />

                <div className="w-[1px] h-8 bg-white/10 mx-1" />

                <ToolBtn icon={Type} label="Text" onClick={handleAddText} />
                <div className="relative h-full flex" ref={emojiRef}>
                    <ToolBtn icon={Smile} label="Emoji" onClick={() => setShowEmojiPicker(!showEmojiPicker)} active={showEmojiPicker} />
                    {showEmojiPicker && (
                        <div className="absolute top-[110%] left-0 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 origin-top-left ring-1 ring-white/10 z-50">
                            <EmojiPicker onEmojiClick={handleAddEmoji} theme={Theme.DARK} lazyLoadEmojis={true} width={320} height={400} />
                        </div>
                    )}
                </div>
                <div className="relative h-full flex" ref={shapeRef}>
                    <ToolBtn icon={Box} label="Shape" onClick={() => setShowShapeMenu(!showShapeMenu)} active={showShapeMenu} dropdown />
                    {showShapeMenu && (
                        <div className="absolute top-[110%] left-0 w-64 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 origin-top-left z-50">
                            <div className="text-[10px] font-bold text-slate-500 uppercase px-1 py-1 tracking-wider mb-2">Shapes Library</div>
                            <div className="grid grid-cols-3 gap-1">
                                <ShapeItem type="rect" icon={Square} label="Rect" />
                                <ShapeItem type="circle" icon={Circle} label="Circle" />
                                <ShapeItem type="line" icon={Minus} label="Line" />
                                <ShapeItem type="triangle" icon={Triangle} label="Triangle" />
                                <ShapeItem type="star" icon={Star} label="Star" />
                                <ShapeItem type="pentagon" icon={Hexagon} label="Pentagon" />
                                <ShapeItem type="hexagon" icon={Hexagon} label="Hexagon" />
                                <ShapeItem type="octagon" icon={Octagon} label="Octagon" />
                            </div>
                        </div>
                    )}
                </div>
                <ToolBtn icon={Upload} label="Upload" onClick={() => document.getElementById('gen-upload')?.click()} />
                <input id="gen-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />

                {hasAI && (
                    <>
                        <div className="w-[1px] h-8 bg-white/10 mx-1" />

                        <ToolBtn
                            icon={Sparkles}
                            label="AI Gen"
                            onClick={() => setShowMagicModal(true)}
                            iconClassName="text-brand-400"
                            active={showMagicModal}
                        />
                        {showMagicModal && <MagicIconModal onClose={() => setShowMagicModal(false)} />}
                    </>
                )}
            </div>

            {/* Center Canvas Controls */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                    <button
                        onClick={undo} disabled={!canUndo}
                        className={cn("p-1.5 hover:bg-white/10 rounded-full transition-colors", !canUndo ? "opacity-30 cursor-not-allowed" : "text-slate-300 hover:text-white")}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={16} />
                    </button>
                    <div className="w-[1px] h-4 bg-white/10" />
                    <button
                        onClick={redo} disabled={!canRedo}
                        className={cn("p-1.5 hover:bg-white/10 rounded-full transition-colors", !canRedo ? "opacity-30 cursor-not-allowed" : "text-slate-300 hover:text-white")}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-black/30 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleZoom(-0.1)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <Minus size={14} />
                        </button>
                        <div className="w-12 text-center text-xs font-mono text-slate-300 select-none">
                            {Math.round(stageConfig.scale * 100)}%
                        </div>
                        <button onClick={() => handleZoom(0.1)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-white/10" />

                    <button
                        onClick={handleFit}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                        title="Fit to Screen"
                    >
                        <Maximize size={12} />
                        <span className="hidden sm:inline">Fit</span>
                    </button>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 h-full py-2">




                <button
                    onClick={onExport}
                    className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-xs transition-colors shadow-lg shadow-brand-500/20 mr-2"
                >
                    <Download size={16} />
                    Export
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
